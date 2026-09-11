'use client';

import React from 'react';
import AiGridFleetModule from '../dashboard/modules/AiGridFleetModule';

export default function AdminAgentsStandalonePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-subtle)' }}>
      <AiGridFleetModule />
    </div>
  );
}
