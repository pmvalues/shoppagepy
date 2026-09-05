'use client';

import { useRef } from 'react';

export interface ProformaInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    invoiceNumber: string;
    date: string;
    validUntil: string;
    merchant: {
      name: string;
      cipcNumber: string;
      vatNumber: string;
      address: string;
      suburb: string;
      bankName: string;
      accountNumber: string;
      branchCode: string;
    };
    buyer: {
      name: string;
      companyName?: string;
      phone: string;
      email?: string;
    };
    items: Array<{
      id: string;
      title: string;
      sku: string;
      gtin13?: string;
      quantity: number;
      unitPriceZar: number;
    }>;
  };
}

export default function ProformaInvoiceModal({ isOpen, onClose, invoiceData }: ProformaInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const { merchant, buyer, items, invoiceNumber, date, validUntil } = invoiceData;

  const totalExclVat = items.reduce((sum, it) => sum + (it.unitPriceZar / 1.15) * it.quantity, 0);
  const vatAmount = totalExclVat * 0.15;
  const totalInclVat = totalExclVat + vatAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div style={{ padding: '1rem 1.5rem', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🇿🇦</span>
            <strong style={{ fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              OFFICIAL PROFORMA TAX INVOICE · SOUTH AFRICA
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#1E293B',
                color: '#FFFFFF',
                border: '1px solid #334155',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🖨️ Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#334155',
                color: '#FFFFFF',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div ref={printRef} style={{ padding: '2rem', overflowY: 'auto', flex: 1, color: '#0F172A', fontSize: '0.85rem' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0F172A', paddingBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A' }}>{merchant.name}</div>
              <div style={{ color: '#475569', marginTop: '0.2rem' }}>{merchant.address}</div>
              <div style={{ color: '#475569' }}>{merchant.suburb}, South Africa</div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                <div>CIPC Reg: <strong>{merchant.cipcNumber}</strong></div>
                <div>SARS VAT Reg: <strong>{merchant.vatNumber}</strong></div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1A73E8' }}>PROFORMA INVOICE</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.2rem' }}>#{invoiceNumber}</div>
              <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '0.4rem' }}>Date: {date}</div>
              <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Valid Until: {validUntil}</div>
            </div>
          </div>

          {/* Buyer Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1.25rem 0', background: '#F8FAFC', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>Billed To</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '0.2rem' }}>{buyer.companyName || buyer.name}</div>
              {buyer.companyName && <div>Attn: {buyer.name}</div>}
              <div style={{ color: '#475569' }}>Phone: {buyer.phone}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>Fulfillment Mode</div>
              <div style={{ fontWeight: 700, color: '#059669', marginTop: '0.2rem' }}>Direct Counter Collection / Trade EFT</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Hold Period: 24 Hours upon Proforma Lock</div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>
                <th style={{ textAlign: 'left', padding: '0.65rem' }}>Line Item & GS1 GTIN</th>
                <th style={{ textAlign: 'center', padding: '0.65rem', width: '60px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '0.65rem', width: '120px' }}>Unit Excl VAT</th>
                <th style={{ textAlign: 'right', padding: '0.65rem', width: '120px' }}>Total Excl VAT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const lineExcl = (it.unitPriceZar / 1.15) * it.quantity;
                return (
                  <tr key={it.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.75rem 0.65rem' }}>
                      <div style={{ fontWeight: 700 }}>{it.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        SKU: {it.sku} {it.gtin13 ? `· GTIN: ${it.gtin13}` : ''}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.75rem 0.65rem', fontWeight: 600 }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '0.75rem 0.65rem' }}>
                      R {(it.unitPriceZar / 1.15).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.75rem 0.65rem', fontWeight: 700 }}>
                      R {lineExcl.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid #CBD5E1', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Subtotal (Excl. VAT):</span>
                <span>R {totalExclVat.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>VAT (15% Standard Rate):</span>
                <span>R {vatAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', borderTop: '2px solid #0F172A', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                <span>Total Due (ZAR):</span>
                <span>R {totalInclVat.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Banking & Settlement Instructions */}
          <div style={{ marginTop: '2rem', borderTop: '1px dashed #CBD5E1', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Settlement Banking Details (EFT)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#334155' }}>Bank: <strong>{merchant.bankName}</strong></div>
              <div style={{ fontSize: '0.8rem', color: '#334155' }}>Account Name: <strong>{merchant.name}</strong></div>
              <div style={{ fontSize: '0.8rem', color: '#334155' }}>Account Number: <strong>{merchant.accountNumber}</strong></div>
              <div style={{ fontSize: '0.8rem', color: '#334155' }}>Branch Code: <strong>{merchant.branchCode}</strong></div>
              <div style={{ fontSize: '0.8rem', color: '#1A73E8', fontWeight: 700, marginTop: '0.2rem' }}>
                Payment Reference: {invoiceNumber}
              </div>
            </div>

            <div style={{ maxWidth: '300px', fontSize: '0.72rem', color: '#64748B' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>Statutory Notice:</div>
              This Proforma Tax Invoice is issued under the South African Value-Added Tax Act, 1991. Present this document upon collection or provide proof of EFT payment to the trade counter dispatch manager.
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Strip */}
        <div style={{ padding: '0.85rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            🛡️ Certified 0% Take-Rate Direct Trade Order
          </span>
          <button
            onClick={() => {
              alert(`Order locked! Proforma #${invoiceNumber} has been submitted to ${merchant.name} dispatch counter. Your stock is reserved for 24 hours.`);
              onClose();
            }}
            style={{
              background: '#059669',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Confirm & Reserve Counter Stock →
          </button>
        </div>
      </div>
    </div>
  );
}
