#!/usr/bin/env python3
"""Download a large HTTP object with validated parallel byte ranges.

Each range is independently resumable. The final object is assembled only after
every part has the expected length, then checked against the advertised size and
hashed with SHA-256. A provenance JSON file can be emitted for reproducibility.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path


USER_AGENT = "ShoppageCommerceGraph/0.3"
BUFFER_SIZE = 1024 * 1024


@dataclass(frozen=True)
class RemoteObject:
    size: int
    etag: str | None
    last_modified: str | None
    accept_ranges: str | None


def request(url: str, *, method: str = "GET", headers: dict[str, str] | None = None):
    request_headers = {"User-Agent": USER_AGENT, "Accept-Encoding": "identity"}
    request_headers.update(headers or {})
    return urllib.request.urlopen(
        urllib.request.Request(url, method=method, headers=request_headers), timeout=180
    )


def inspect_remote(url: str) -> RemoteObject:
    with request(url, method="HEAD") as response:
        size_text = response.headers.get("Content-Length")
        if not size_text:
            raise RuntimeError("Server did not advertise Content-Length")
        return RemoteObject(
            size=int(size_text),
            etag=response.headers.get("ETag"),
            last_modified=response.headers.get("Last-Modified"),
            accept_ranges=response.headers.get("Accept-Ranges"),
        )


def ranges(size: int, workers: int) -> list[tuple[int, int]]:
    chunk = (size + workers - 1) // workers
    return [(start, min(size - 1, start + chunk - 1)) for start in range(0, size, chunk)]


def download_part(
    url: str,
    part_path: Path,
    start: int,
    end: int,
    attempts: int,
) -> dict[str, int | str]:
    expected = end - start + 1
    if part_path.exists() and part_path.stat().st_size == expected:
        return {"part": part_path.name, "bytes": expected, "state": "reused"}
    if part_path.exists():
        part_path.unlink()

    for attempt in range(1, attempts + 1):
        temporary = part_path.with_suffix(part_path.suffix + ".partial")
        if temporary.exists():
            temporary.unlink()
        try:
            with request(url, headers={"Range": f"bytes={start}-{end}"}) as response:
                status = getattr(response, "status", response.getcode())
                content_range = response.headers.get("Content-Range", "")
                expected_range = f"bytes {start}-{end}/"
                if status != 206 or not content_range.startswith(expected_range):
                    raise RuntimeError(
                        f"Invalid ranged response: status={status}, Content-Range={content_range!r}"
                    )
                with temporary.open("wb") as target:
                    while True:
                        block = response.read(BUFFER_SIZE)
                        if not block:
                            break
                        target.write(block)
            received = temporary.stat().st_size
            if received != expected:
                raise RuntimeError(f"Part length {received} != expected {expected}")
            temporary.replace(part_path)
            return {"part": part_path.name, "bytes": expected, "state": "downloaded"}
        except (OSError, RuntimeError, urllib.error.URLError) as exc:
            if temporary.exists():
                temporary.unlink()
            if attempt == attempts:
                raise RuntimeError(
                    f"Failed {part_path.name} after {attempts} attempts: {exc}"
                ) from exc
            time.sleep(min(2**attempt, 20))
    raise AssertionError("unreachable")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        while block := source.read(BUFFER_SIZE * 4):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("destination", type=Path)
    parser.add_argument("--workers", type=int, default=16)
    parser.add_argument("--attempts", type=int, default=5)
    parser.add_argument("--provenance", type=Path)
    args = parser.parse_args()

    if not 1 <= args.workers <= 32:
        raise SystemExit("--workers must be between 1 and 32")

    remote = inspect_remote(args.url)
    if (remote.accept_ranges or "").lower() != "bytes":
        raise RuntimeError(f"Server does not advertise byte ranges: {remote.accept_ranges!r}")

    args.destination.parent.mkdir(parents=True, exist_ok=True)
    part_dir = args.destination.with_name(args.destination.name + ".parts")
    part_dir.mkdir(parents=True, exist_ok=True)
    byte_ranges = ranges(remote.size, args.workers)

    print(
        json.dumps(
            {
                "event": "download_start",
                "bytes": remote.size,
                "parts": len(byte_ranges),
                "etag": remote.etag,
                "last_modified": remote.last_modified,
            }
        ),
        flush=True,
    )

    results: list[dict[str, int | str]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(
                download_part,
                args.url,
                part_dir / f"part-{index:03d}",
                start,
                end,
                args.attempts,
            ): (index, start, end)
            for index, (start, end) in enumerate(byte_ranges)
        }
        for future in concurrent.futures.as_completed(futures):
            index, start, end = futures[future]
            result = future.result()
            results.append(result)
            print(
                json.dumps(
                    {
                        "event": "part_complete",
                        "index": index,
                        "start": start,
                        "end": end,
                        **result,
                    }
                ),
                flush=True,
            )

    assembled = args.destination.with_suffix(args.destination.suffix + ".assembling")
    with assembled.open("wb") as target:
        for index in range(len(byte_ranges)):
            part_path = part_dir / f"part-{index:03d}"
            with part_path.open("rb") as source:
                while block := source.read(BUFFER_SIZE * 4):
                    target.write(block)
    if assembled.stat().st_size != remote.size:
        raise RuntimeError(
            f"Assembled length {assembled.stat().st_size} != advertised {remote.size}"
        )
    # Windows cannot atomically replace a destination that is still present in
    # some circumstances. At this point every source part and the assembled
    # length have already passed validation, so remove only this requested
    # destination before promoting the verified assembly.
    if args.destination.exists():
        args.destination.unlink()
    assembled.replace(args.destination)
    file_sha256 = sha256(args.destination)

    provenance = {
        "source_url": args.url,
        "downloaded_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "content_length_bytes": remote.size,
        "etag": remote.etag,
        "last_modified": remote.last_modified,
        "accept_ranges": remote.accept_ranges,
        "sha256": file_sha256,
        "destination": os.fspath(args.destination.resolve()),
        "part_count": len(byte_ranges),
        "parts_reused": sum(result["state"] == "reused" for result in results),
    }
    if args.provenance:
        args.provenance.parent.mkdir(parents=True, exist_ok=True)
        args.provenance.write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"event": "download_complete", **provenance}), flush=True)


if __name__ == "__main__":
    main()
