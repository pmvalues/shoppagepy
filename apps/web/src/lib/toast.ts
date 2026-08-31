/**
 * Non-blocking toast — replaces native window.alert() across the app.
 * Investor-safe: no browser modal, auto-dismiss, aria-live polite for screen readers.
 */
export function showToast(message: string, variant: 'info' | 'success' = 'info'): void {
  if (typeof document === 'undefined') return;

  const HOST_ID = 'shoppage-toast-host';
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-atomic', 'false');
    host.style.cssText =
      'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:0.5rem;align-items:center;pointer-events:none;';
    document.body.appendChild(host);
  }

  const el = document.createElement('div');
  const bg = variant === 'success' ? '#0F172A' : '#1E293B';
  el.style.cssText = `background:${bg};color:#FFFFFF;padding:0.7rem 1.15rem;border-radius:10px;font-size:0.85rem;font-weight:600;box-shadow:0 10px 25px -5px rgba(15,23,42,0.4);border:1px solid #334155;max-width:min(90vw,420px);text-align:center;opacity:0;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease;`;
  el.textContent = message;
  host.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    window.setTimeout(() => el.remove(), 220);
  }, 2800);
}
