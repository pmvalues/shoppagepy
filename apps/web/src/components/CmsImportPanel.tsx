'use client';

import { useState } from 'react';

type Collection = 'merchants' | 'products';

interface DryRunResult {
  dryRun: boolean;
  collection: string;
  total: number;
  valid: number;
  errors: Array<{ row: number; messages: string[] }>;
  sample?: Array<Record<string, unknown>>;
  imported?: number;
  failed?: Array<{ row: string; message: string }>;
}

const panel: React.CSSProperties = {
  background: '#111827',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #1F2937',
};

const input: React.CSSProperties = {
  background: '#0B1220',
  border: '1px solid #1F2937',
  borderRadius: '8px',
  color: '#F8FAFC',
  padding: '0.6rem 0.8rem',
  fontSize: '0.85rem',
  width: '100%',
};

const btn: React.CSSProperties = {
  background: '#10B981',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '0.6rem 1.2rem',
  fontWeight: 800,
  fontSize: '0.85rem',
  cursor: 'pointer',
};

export default function CmsImportPanel() {
  const [collection, setCollection] = useState<Collection>('products');
  const [token, setToken] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const runImport = async (dryRun: boolean) => {
    if (!file) {
      setError('Choose a CSV file first.');
      return;
    }
    if (!token.trim()) {
      setError('Enter the admin import token first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('collection', collection);
      form.append('file', file);
      form.append('dryRun', String(dryRun));
      const res = await fetch('/api/cms/import', {
        method: 'POST',
        headers: { 'x-admin-token': token.trim() },
        body: form,
      });
      const data = (await res.json()) as DryRunResult & { error?: string };
      if (!res.ok) {
        setError(data.error || `Import failed (HTTP ${res.status})`);
        setResult(null);
        return;
      }
      setResult(data);
    } catch {
      setError('Network error reaching the import endpoint.');
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>
        Bulk CSV Import
      </h1>
      <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
        Load merchants or products in bulk. Dry-run validates every row before anything is written.
        Imported items go live on the storefront immediately.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={panel}>
          <h4 style={{ color: '#38BDF8', margin: '0 0 0.75rem 0' }}>1. Collection &amp; file</h4>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {(['products', 'merchants'] as Collection[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCollection(c);
                  setResult(null);
                }}
                style={{
                  ...btn,
                  background: collection === c ? '#10B981' : '#1E293B',
                  color: collection === c ? '#fff' : '#94A3B8',
                }}
              >
                {c === 'products' ? 'Products' : 'Merchants'}
              </button>
            ))}
          </div>
          <a
            href={`/api/cms/import?collection=${collection}`}
            style={{ color: '#38BDF8', fontSize: '0.8rem', display: 'inline-block', marginBottom: '0.75rem' }}
          >
            ⬇ Download CSV template ({collection})
          </a>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
            }}
            style={{ ...input, padding: '0.5rem' }}
          />
        </div>

        <div style={panel}>
          <h4 style={{ color: '#38BDF8', margin: '0 0 0.75rem 0' }}>2. Authorize &amp; run</h4>
          <input
            type="password"
            placeholder="Admin import token (SHOPPAGE_ADMIN_TOKEN)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ ...input, marginBottom: '0.75rem' }}
            autoComplete="off"
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => runImport(true)} disabled={busy} style={btn}>
              {busy ? 'Working…' : 'Dry-run validate'}
            </button>
            <button
              type="button"
              onClick={() => runImport(false)}
              disabled={busy}
              style={{ ...btn, background: '#F59E0B' }}
            >
              Confirm import
            </button>
          </div>
          {error && <p style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '0.75rem' }}>{error}</p>}
        </div>
      </div>

      {result && (
        <div style={panel}>
          <h4 style={{ color: '#38BDF8', margin: '0 0 0.75rem 0' }}>
            {result.dryRun ? 'Validation report' : 'Import result'} — {result.collection}
          </h4>
          <p style={{ color: '#CBD5E1', fontSize: '0.85rem' }}>
            {result.total} rows · <strong style={{ color: '#10B981' }}>{result.valid} valid</strong>
            {result.errors.length > 0 && (
              <> · <strong style={{ color: '#EF4444' }}>{result.errors.length} with errors</strong></>
            )}
            {result.imported !== undefined && (
              <> · <strong style={{ color: '#10B981' }}>{result.imported} imported</strong></>
            )}
          </p>
          {result.errors.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              {result.errors.slice(0, 20).map((e, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: '#FCA5A5', padding: '0.25rem 0' }}>
                  Row {e.row}: {e.messages.join('; ')}
                </div>
              ))}
              {result.errors.length > 20 && (
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  …and {result.errors.length - 20} more
                </div>
              )}
            </div>
          )}
          {result.sample && result.sample.length > 0 && (
            <pre
              style={{
                marginTop: '0.75rem',
                background: '#0B1220',
                border: '1px solid #1F2937',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.72rem',
                color: '#94A3B8',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(result.sample.slice(0, 3), null, 1)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
