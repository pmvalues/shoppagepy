'use client';

import { useState, type ReactNode } from 'react';

export interface ProductTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export default function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div className="pdp-tabs">
      <div className="pdp-tablist" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            className={`pdp-tab ${active === tab.id ? 'is-active' : ''}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          className="pdp-tabpanel"
          style={{ display: active === tab.id ? 'block' : 'none' }}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
