// Shoppage consumer site: theme, search suggestions, location label,
// assistant and drawer behaviour. Progressive: every page works without it.
(function () {
	"use strict";
	var ls = {
		get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
		set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
	};

	// ---- Theme: system → light → dark ----
	var order = ["system", "light", "dark"];
	function applyTheme(t) {
		var root = document.documentElement;
		if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
		ls.set("shoppage_theme", t);
		document.querySelectorAll("[data-theme-label]").forEach(function (el) { el.textContent = "Theme: " + t; });
	}
	document.addEventListener("click", function (e) {
		if (e.target.closest("[data-theme-toggle]")) {
			var cur = ls.get("shoppage_theme") || "system";
			applyTheme(order[(order.indexOf(cur) + 1) % order.length]);
		}
	});

	// ---- Location label from the location picker ----
	function showLocation() {
		var raw = ls.get("shoppage_location"), label = "";
		try { label = raw ? (JSON.parse(raw).label || "") : ""; } catch (e) {}
		if (!label) label = ls.get("shoppage_province") || "";
		document.querySelectorAll("[data-location-label]").forEach(function (el) { el.textContent = label || "Set location"; });
	}

	// ---- Search suggestions (Google-style) ----
	function wireSearch(box) {
		if (box.dataset.wired) return;
		box.dataset.wired = "1";
		var input = box.querySelector("input[name=q]"), list = box.querySelector(".suggest"), form = box.querySelector("form");
		var timer = null, items = [], sel = -1, recentKey = "shoppage_recent";
		function recent() { try { return JSON.parse(ls.get(recentKey) || "[]"); } catch (e) { return []; } }
		function close() { list.classList.remove("open"); input.setAttribute("aria-expanded", "false"); sel = -1; }
		function render(rows, title) {
			list.textContent = "";
			items = [];
			if (!rows.length) { close(); return; }
			if (title) { var h = document.createElement("div"); h.className = "hint"; h.textContent = title; list.appendChild(h); }
			rows.forEach(function (r) {
				var a = document.createElement("a");
				a.href = "/search?q=" + encodeURIComponent(r);
				a.setAttribute("role", "option");
				var ico = document.createElement("span"); ico.className = "faint"; ico.textContent = title ? "↺" : "⌕"; ico.setAttribute("aria-hidden", "true");
				var t = document.createElement("span"); t.textContent = r;
				a.appendChild(ico); a.appendChild(t);
				list.appendChild(a);
				items.push(a);
			});
			list.classList.add("open");
			input.setAttribute("aria-expanded", "true");
		}
		input.addEventListener("focus", function () { if (!input.value.trim()) render(recent().slice(0, 6), "Recent searches"); });
		input.addEventListener("input", function () {
			clearTimeout(timer);
			var q = input.value.trim();
			if (!q) { render(recent().slice(0, 6), "Recent searches"); return; }
			timer = setTimeout(function () {
				fetch("/api/search/suggest?q=" + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (rows) {
					if (input.value.trim() === q) render((rows || []).slice(0, 8), "");
				}).catch(close);
			}, 120);
		});
		input.addEventListener("keydown", function (e) {
			if (!list.classList.contains("open")) return;
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				if (sel >= 0) items[sel].classList.remove("sel");
				sel = e.key === "ArrowDown" ? Math.min(items.length - 1, sel + 1) : Math.max(-1, sel - 1);
				if (sel >= 0) { items[sel].classList.add("sel"); input.value = items[sel].textContent.slice(1); }
			} else if (e.key === "Escape") { close(); }
		});
		document.addEventListener("click", function (e) { if (!box.contains(e.target)) close(); });
		form.addEventListener("submit", function () {
			var q = input.value.trim();
			if (!q) return;
			var r = recent().filter(function (x) { return x !== q; });
			r.unshift(q);
			ls.set(recentKey, JSON.stringify(r.slice(0, 10)));
		});
		var clear = box.querySelector("[data-clear]");
		if (clear) clear.addEventListener("click", function () { input.value = ""; input.focus(); render(recent().slice(0, 6), "Recent searches"); });
	}

	// ---- Assistant ----
	function escapeText(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
	function bubble(cls, text) {
		var b = document.createElement("div");
		b.className = "bubble " + cls;
		b.innerHTML = escapeText(text).replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
		return b;
	}
	function ask(q) {
		var msgs = document.getElementById("ask-msgs");
		if (!msgs || !q) return;
		msgs.appendChild(bubble("me", q));
		var wait = bubble("it", "Looking…");
		msgs.appendChild(wait);
		msgs.scrollTop = msgs.scrollHeight;
		fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q }) })
			.then(function (r) { return r.json(); })
			.then(function (d) {
				var b = bubble("it", d.reply || "I couldn't find anything for that.");
				(d.products || []).slice(0, 4).forEach(function (p) {
					var a = document.createElement("a");
					a.className = "p"; a.href = "/p/" + encodeURIComponent(p.id);
					if (p.imageUrl) { var img = document.createElement("img"); img.src = p.imageUrl; img.alt = ""; a.appendChild(img); }
					var t = document.createElement("span");
					t.innerHTML = "<b>" + escapeText(p.title) + "</b><br>R " + Number(p.priceZar || 0).toFixed(2);
					a.appendChild(t);
					b.appendChild(a);
				});
				wait.replaceWith(b);
				msgs.scrollTop = msgs.scrollHeight;
			})
			.catch(function () { wait.textContent = "The assistant can't be reached right now. Try the search box instead."; });
	}
	document.addEventListener("click", function (e) {
		var panel = document.getElementById("ask-panel");
		if (!panel) return;
		if (e.target.closest("[data-ask-open]")) {
			panel.classList.toggle("open");
			e.target.closest("[data-ask-open]").setAttribute("aria-expanded", String(panel.classList.contains("open")));
			if (panel.classList.contains("open")) document.getElementById("ask-input").focus();
		}
		if (e.target.closest("[data-ask-close]")) panel.classList.remove("open");
		var sug = e.target.closest("[data-ask-q]");
		if (sug) ask(sug.getAttribute("data-ask-q"));
		// Close drawers and modals from their scrim or close buttons.
		if (e.target.matches(".drawer-scrim") || e.target.closest("[data-drawer-close]")) {
			var host = document.getElementById("buybox-drawer");
			if (host) host.innerHTML = "";
		}
	});
	document.addEventListener("submit", function (e) {
		if (!e.target.matches("[data-ask-form]")) return;
		e.preventDefault();
		var input = document.getElementById("ask-input");
		ask(input.value.trim());
		input.value = "";
	});
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") {
			var host = document.getElementById("buybox-drawer");
			if (host && host.firstChild) host.innerHTML = "";
			var panel = document.getElementById("ask-panel");
			if (panel) panel.classList.remove("open");
		}
		if (e.key === "/" && !(e.target && e.target.closest && e.target.closest("input, textarea, select"))) {
			var q = document.querySelector(".searchbox input[name=q]");
			if (q) { e.preventDefault(); q.focus(); }
		}
	});

	// ---- Product gallery thumbnails ----
	document.addEventListener("click", function (e) {
		var t = e.target.closest("[data-thumb]");
		if (!t) return;
		var main = document.querySelector("[data-main-img]");
		if (main) main.src = t.getAttribute("data-thumb");
		t.parentElement.querySelectorAll("[data-thumb]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); });
	});

	function boot() {
		// Keep the current query in the top search box on results pages.
		var q = new URLSearchParams(location.search).get("q");
		if (q && location.pathname === "/search") {
			document.querySelectorAll(".searchbox input[name=q]").forEach(function (i) { if (!i.value) i.value = q; });
		}
		document.querySelectorAll("[data-searchbox]").forEach(wireSearch);
		showLocation();
		var th = ls.get("shoppage_theme") || "system";
		document.querySelectorAll("[data-theme-label]").forEach(function (el) { el.textContent = "Theme: " + th; });
	}
	document.addEventListener("DOMContentLoaded", boot);
	document.addEventListener("htmx:afterSettle", boot);
	window.addEventListener("storage", showLocation);

	if ("serviceWorker" in navigator) {
		window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
	}
})();
