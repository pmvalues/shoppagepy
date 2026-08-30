export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function AgencyHubPage() {
  const managedClients = [
    { name: 'SunPower Solutions (Crown Mines)', offers: 14, freshnessRate: '100%', trustScore: 94, leadsThisMonth: 142 },
    { name: 'SolarBros Sandton City', offers: 28, freshnessRate: '98%', trustScore: 96, leadsThisMonth: 310 },
    { name: 'TechHub Oriental Plaza', offers: 45, freshnessRate: '95%', trustScore: 91, leadsThisMonth: 188 },
    { name: "Mama's Phone Spaza (Soweto Bara)", offers: 6, freshnessRate: '100%', trustScore: 89, leadsThisMonth: 64 },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>
            🏢 Agency & Integrator Multi-Client OS
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0.25rem 0', color: 'var(--slate-900)' }}>
            Apex Commerce Partners (Johannesburg)
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem' }}>
            Managing 4 Active Merchant Clients · 93 Live Offers · R1.2M Attributed Monthly Commerce
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/agency/field-marshal" className="btn btn-whatsapp" style={{ fontWeight: 800 }}>
            🎖️ Open Field Marshal Ground Portal
          </Link>
          <Link href="/merchant/claim" className="btn btn-outline">
            + Onboard New Merchant
          </Link>
        </div>
      </div>

      {/* Managed Clients Roster */}
      <section className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Managed Merchant Portfolios</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--slate-500)' }}>
                <th style={{ padding: '0.75rem' }}>Merchant Name</th>
                <th style={{ padding: '0.75rem' }}>Active Offers</th>
                <th style={{ padding: '0.75rem' }}>Freshness Health</th>
                <th style={{ padding: '0.75rem' }}>Trust Score</th>
                <th style={{ padding: '0.75rem' }}>Attributed Leads</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managedClients.map((client) => (
                <tr key={client.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--slate-900)' }}>{client.name}</td>
                  <td style={{ padding: '0.75rem' }}>{client.offers} SKUs</td>
                  <td style={{ padding: '0.75rem' }}><span className="badge badge-green">{client.freshnessRate}</span></td>
                  <td style={{ padding: '0.75rem', fontWeight: 800, color: '#059669' }}>{client.trustScore} / 100</td>
                  <td style={{ padding: '0.75rem', fontWeight: 800, color: '#2563EB' }}>{client.leadsThisMonth} leads</td>
                  <td style={{ padding: '0.75rem' }}>
                    <Link href="/merchant/dashboard" className="btn btn-outline btn-sm">
                      Manage Client &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
