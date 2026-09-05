'use client';

import { useState, useEffect, useMemo } from 'react';
import ProformaInvoiceModal from './ProformaInvoiceModal';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  brand?: string;
  image?: string;
  stockistLocation?: string;
  merchantId?: string;
  merchantName?: string;
}

export default function TradeCartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [invoiceRef, setInvoiceRef] = useState<string | null>(null);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [showProformaModal, setShowProformaModal] = useState(false);
  const [proformaData, setProformaData] = useState<any | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shoppage_cart_items');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Save cart to localStorage whenever items change
  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('shoppage_cart_items', JSON.stringify(newItems));
      // Dispatch event to keep navbar badge in sync
      const totalCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      window.dispatchEvent(
        new CustomEvent('shoppage-cart-sync', { detail: { count: totalCount } })
      );
    } catch {
      /* ignore */
    }
  };

  // Listen for incoming cart events from buttons across the site
  useEffect(() => {
    const handleCartEvent = (e: CustomEvent) => {
      const detail = e.detail;
      if (!detail) return;

      if (detail.action === 'add' && detail.item) {
        const item = detail.item;
        const priceNum =
          typeof item.price === 'number'
            ? item.price
            : parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0;

        setItems((prev) => {
          const existingIndex = prev.findIndex(
            (p) => p.name.toLowerCase() === item.name.toLowerCase()
          );
          let updated: CartItem[];
          if (existingIndex >= 0) {
            updated = [...prev];
            updated[existingIndex].quantity += 1;
          } else {
            updated = [
              ...prev,
              {
                id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                name: item.name,
                price: priceNum,
                quantity: 1,
                brand: item.brand,
                image: item.image,
                stockistLocation: item.stockistLocation || 'Verified Trade Counter, Johannesburg',
              },
            ];
          }
          try {
            localStorage.setItem('shoppage_cart_items', JSON.stringify(updated));
            const totalCount = updated.reduce((sum, it) => sum + it.quantity, 0);
            window.dispatchEvent(
              new CustomEvent('shoppage-cart-sync', { detail: { count: totalCount } })
            );
          } catch {}
          return updated;
        });
      }
    };

    window.addEventListener('shoppage-cart' as any, handleCartEvent);
    return () => window.removeEventListener('shoppage-cart' as any, handleCartEvent);
  }, []);

  const totalZar = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const updateQuantity = (id: string, delta: number) => {
    const updated = items
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter((item): item is CartItem => item !== null);

    saveCart(updated);
  };

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const handleRequestInvoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (items.length === 0) return;
    setIsCheckingOut(true);

    const generatedNumber = `SP-INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const firstMerchantName = items[0]?.merchantName || 'SunPower South Africa (Pty) Ltd';

    const invoicePayload = {
      invoiceNumber: generatedNumber,
      date: now.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
      validUntil: expiry.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
      merchant: {
        name: firstMerchantName,
        cipcNumber: '2021/489102/07',
        vatNumber: '4910294812',
        address: items[0]?.stockistLocation || 'Genesis Blvd, Crown Mines',
        suburb: 'Crown Mines, Johannesburg',
        bankName: 'Standard Bank South Africa',
        accountNumber: '0012948102',
        branchCode: '051001',
      },
      buyer: {
        name: buyerName || 'Verified Trade Buyer',
        phone: buyerPhone || '+27 82 000 0000',
      },
      items: items.map((it) => ({
        id: it.id,
        title: it.name,
        sku: `SKU-${it.id.slice(-6).toUpperCase()}`,
        quantity: it.quantity,
        unitPriceZar: it.price,
      })),
    };

    setProformaData(invoicePayload);
    setShowProformaModal(true);

    try {
      await fetch('/api/v1/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCategory: 'wholesale_trade',
          itemSummary: items.map((it) => `${it.quantity}x ${it.name}`).join(', '),
          buyerContact: {
            name: buyerName || 'Verified Trade Buyer',
            phone: buyerPhone || '+27 10 500 7670',
          },
          additionalNotes: `Total estimated value: R ${totalZar.toLocaleString('en-ZA')}. Proforma ${generatedNumber} generated.`,
        }),
      });
      setInvoiceRef(generatedNumber);
    } catch (err) {
      console.error('[Cart] Invoice request log error:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(9, 13, 22, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: 'var(--card, #111726)',
          borderLeft: '1px solid var(--border, #1E293B)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text, #F1F5F9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border, #1E293B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg, #090D16)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.35rem' }}>🛒</span>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Trade Desk Cart</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text2, #94A3B8)' }}>
                {items.length} {items.length === 1 ? 'line item' : 'line items'} · 0% commission
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text2, #94A3B8)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {invoiceRequested ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid var(--brand, #10B981)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                marginTop: '1rem',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                Trade Invoice Requested!
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text2, #94A3B8)', lineHeight: 1.5 }}>
                Your order has been registered under reference:
                <br />
                <strong style={{ color: 'var(--brand, #10B981)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {invoiceRef}
                </strong>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text2, #94A3B8)' }}>
                The stockist and Shoppage Clearing Desk will contact you on WhatsApp with verified bank details and dispatch times.
              </p>
              <button
                onClick={() => {
                  setInvoiceRequested(false);
                  onClose();
                }}
                style={{
                  marginTop: '1rem',
                  background: 'var(--brand, #10B981)',
                  color: '#090D16',
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--text2, #94A3B8)',
              }}
            >
              <span style={{ fontSize: '3rem', opacity: 0.4, marginBottom: '1rem' }}>🛒</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
                Your trade cart is empty
              </h3>
              <p style={{ fontSize: '0.825rem', lineHeight: 1.5, margin: 0 }}>
                Click <strong>“Lock Deal ⚡”</strong> on any product card in the stream to aggregate wholesale deals into a single invoice.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg, #090D16)',
                    border: '1px solid var(--border, #1E293B)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    gap: '0.85rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--brand, #10B981)', fontWeight: 700 }}>
                      {item.brand || 'Verified Stockist'}
                    </div>
                    <h4
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        margin: '0.2rem 0',
                        color: 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </h4>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text2, #94A3B8)' }}>
                      📍 {item.stockistLocation}
                    </div>
                    <div style={{ marginTop: '0.45rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
                      R {(item.price * item.quantity).toLocaleString('en-ZA')}{' '}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text2, #94A3B8)', fontWeight: 400 }}>
                        (R {item.price.toLocaleString('en-ZA')} ea)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text2, #94A3B8)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: 0,
                      }}
                    >
                      🗑️
                    </button>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'var(--card, #111726)',
                        border: '1px solid var(--border, #1E293B)',
                        borderRadius: '6px',
                        padding: '0.15rem 0.35rem',
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text)',
                          fontWeight: 800,
                          cursor: 'pointer',
                          width: '18px',
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text)',
                          fontWeight: 800,
                          cursor: 'pointer',
                          width: '18px',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 && !invoiceRequested && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--border, #1E293B)',
              background: 'var(--bg, #090D16)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text2, #94A3B8)' }}>Estimated Subtotal</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--text)' }}>
                R {totalZar.toLocaleString('en-ZA')}
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => handleRequestInvoice()}
                disabled={isCheckingOut}
                style={{
                  width: '100%',
                  background: '#059669',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>📄 Generate SARS Proforma Tax Invoice</span>
              </button>

              <form onSubmit={handleRequestInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                  <input
                    type="text"
                    placeholder="Your Name / Business"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    required
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border, #1E293B)',
                      background: 'var(--card, #111726)',
                      color: 'var(--text)',
                      fontSize: '0.78rem',
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone (082...)"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    required
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border, #1E293B)',
                      background: 'var(--card, #111726)',
                      color: 'var(--text)',
                      fontSize: '0.78rem',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCheckingOut}
                  style={{
                    width: '100%',
                    background: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {isCheckingOut ? 'Reserving...' : '📍 Reserve for In-Store Pickup (24h Hold)'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showProformaModal && proformaData && (
        <ProformaInvoiceModal
          isOpen={showProformaModal}
          onClose={() => {
            setShowProformaModal(false);
            clearCart();
          }}
          invoiceData={proformaData}
        />
      )}
    </div>
  );
}
