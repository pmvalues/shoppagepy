'use client';

import React from 'react';
import type { Merchant } from '@shoppage/contracts';
import WakerWorkspaceView, {
  WakerAgent,
  WakerIntegration,
  WakerActivityItem,
} from '@/components/waker/WakerWorkspaceView';

export interface AiStoreCrewModuleProps {
  merchant: Merchant;
}

export default function AiStoreCrewModule({ merchant }: AiStoreCrewModuleProps) {
  const storeId = merchant.id || 'loc_mitrend_midrand';

  const agents: WakerAgent[] = [
    {
      id: 'agent_lindiwe',
      name: 'Lindiwe',
      avatar: '👩🏽‍💼',
      role: 'WhatsApp Sales Clerk & Concierge',
      status: 'Online',
      model: 'Gemini 3 Flash',
      workspace: `/stores/${storeId}/whatsapp_concierge`,
      isDefault: true,
      subtitle: 'Instant WhatsApp Sales & Quick Cart',
      skills: ['WhatsApp Business API', 'Quick Cart Auto-Reply', 'Inventory Availability Probe'],
      tasksCompleted: 142,
    },
    {
      id: 'agent_kagiso',
      name: 'Kagiso',
      avatar: '👨🏾‍💻',
      role: 'Catalog & GS1 GTIN Harmonizer',
      status: 'Online',
      model: 'Kernel FTS5 Engine',
      workspace: `/stores/${storeId}/catalog_matrix`,
      subtitle: '157 SKUs · Feed Healthy',
      skills: ['GS1 GTIN-13 Checksum', 'Google Merchant Feed XML', 'Brand Normalization'],
      tasksCompleted: 88,
    },
    {
      id: 'agent_alexander',
      name: 'Alexander',
      avatar: '🕵️‍♂️',
      role: 'Price & Competitor Intelligence Scout',
      status: 'Online',
      model: 'In-Process Sweeper',
      workspace: `/stores/${storeId}/competitor_intelligence`,
      subtitle: 'Regional Malls & BuyBox Guard',
      skills: ['Sandton City Geofence', 'BuyBox Margin Floor', 'Price Drop Sentinel'],
      tasksCompleted: 219,
    },
    {
      id: 'agent_nomvula',
      name: 'Nomvula',
      avatar: '📋',
      role: 'B2B Wholesale RFQ Bidder',
      status: 'Online',
      model: 'DeepSeek V3',
      workspace: `/stores/${storeId}/rfq_tender_desk`,
      subtitle: 'Proforma Quotes & Tenders',
      skills: ['Buyer Tender Matching', 'SARS Tax PIN Check', 'PDF Proforma Generation'],
      tasksCompleted: 34,
    },
  ];

  const integrations: WakerIntegration[] = [
    {
      id: 'im_whatsapp_gateway',
      name: 'WhatsApp Business API · Official Store Concierge',
      type: 'Direct Bot',
      status: 'Connected',
      icon: '💬',
      details: `${merchant.contacts?.whatsapp || merchant.contacts?.telephone || '+27 10 500 7670'} · Automated Quick Cart responder active`,
      badge: 'Active',
    },
    {
      id: 'im_whatsapp_group',
      name: 'Bind VIP Commercial Buyers Group',
      type: 'Group Chat',
      status: 'Connected',
      icon: '👥',
      details: 'Requirements & Stock Inquiry Group · 342 Trade Members',
      badge: 'Live',
    },
  ];

  const activities: WakerActivityItem[] = [
    {
      id: 'act_1',
      type: 'memory',
      categoryLabel: 'Memory Added',
      title: 'Bulk Pricing Discount Rule',
      subtitle: '5% off orders > R10,000',
      timestamp: '8 mins ago',
      icon: '🧠',
      badgeColor: '#10B981',
    },
    {
      id: 'act_2',
      type: 'automation',
      categoryLabel: 'Automation Run',
      title: 'Google Shopping Feed Synced',
      subtitle: '157 valid SKUs pushed',
      timestamp: '24 mins ago',
      icon: '⚡',
      badgeColor: '#3B82F6',
    },
    {
      id: 'act_3',
      type: 'task',
      categoryLabel: 'Task Created',
      title: 'Proforma RFQ #SA-10492',
      subtitle: 'R28,400 catering quote prepared',
      timestamp: '1 hour ago',
      icon: '📋',
      badgeColor: '#8B5CF6',
    },
    {
      id: 'act_4',
      type: 'evolution',
      categoryLabel: 'Skills Self-Evolution',
      title: 'sa_vat_invoice_v2',
      subtitle: 'Automated SARS tax pin rule learned',
      timestamp: '2 hours ago',
      icon: '🌟',
      badgeColor: '#F59E0B',
    },
  ];

  return (
    <WakerWorkspaceView
      mode="merchant"
      appTitle="Shoppage Waker"
      workspaceTitle={`${merchant.name} · Digital Store Operations`}
      workspaceBadge="Flagship Merchant"
      headerBrand="@Waker"
      headerSubtitle="Wake up your AI Store Crew"
      enableButtonText="+ Deploy Store Agent"
      agents={agents}
      integrations={integrations}
      activities={activities}
      step1={{
        title: 'Choose an IM connection',
        subtitle: 'WhatsApp Business API, SMS, or Telegram',
        icon: '🟢',
      }}
      step2={{
        title: 'Connect an IM conversation',
        subtitle: 'Store Direct Chats and VIP Wholesale Groups',
        icon: '💬',
      }}
      step3={{
        title: 'Multiple Wakers collaborate',
        subtitle: 'Sales, pricing, and catalog memory keep accumulating',
        icon: '👥',
      }}
      backLink={{
        href: '/merchant/dashboard',
        label: 'Back to Merchant Centre Overview',
      }}
    />
  );
}
