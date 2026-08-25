import Link from 'next/link';

export default function AgencyHubPage() {
  const managedClients = [
    { name: 'SunPower Solutions (Crown Mines)', offers: 14, freshnessRate: '100%', trustScore: 94, leadsThisMonth: 142 },
    { name: 'SolarBros Sandton City', offers: 28, freshnessRate: '98%', trustScore: 96, leadsThisMonth: 310 },
    { name: 'TechHub Oriental Plaza', offers: 45, freshnessRate: '95%', trustScore: 91, leadsThisMonth: 188 },
    { name: "Mama's Phone Spaza (Soweto Bara)", offers: 6, freshnessRate: '100%', trustScore: 89, leadsThisMonth: 64 },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-purple">
            🏢 Agency Multi-Client Hub
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0' }}>
            Apex Commerce Partners (Johannesburg)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Managing 4 Active Merchant Clients · 93 Live Offers · R1.2M Attributed Monthly Commerce
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline">+ Onboard New Merchant</button>
          <button className="btn btn-primary">📊 Bulk Feed Importer</button>
        </div>
      </div>

      {/* Managed Clients Roster */}
      <section className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Managed Merchant Portfolios</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
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
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{client.name}</td>
                  <td style={{ padding: '0.75rem' }}>{client.offers} SKUs</td>
                  <td style={{ padding: '0.75rem' }}><span className="badge badge-green">{client.freshnessRate}</span></td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent-green)' }}>{client.trustScore} / 100</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{client.leadsThisMonth} leads</td>
                  <td style={{ padding: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      Manage Client →
                    </button>
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
