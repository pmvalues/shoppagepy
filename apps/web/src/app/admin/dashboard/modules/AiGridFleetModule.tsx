'use client';

import React from 'react';
import WakerWorkspaceView, {
  WakerAgent,
  WakerIntegration,
  WakerActivityItem,
} from '@/components/waker/WakerWorkspaceView';

export default function AiGridFleetModule() {
  const agents: WakerAgent[] = [
    {
      id: 'agent_cleansing',
      name: 'Product Cleansing Agent',
      avatar: '🧹',
      role: 'National Catalog Normalizer & GTIN Engine',
      status: 'Online',
      model: 'Kernel Rule Engine + Gemini Flash',
      workspace: '@shoppage/kernel/catalog',
      isDefault: true,
      subtitle: '1,000,000+ Master Products · All 9 Provinces',
      skills: ['Brand Canonicalization', 'Tech Spec Extractor', 'GTIN-13 Checksum Validator', 'Packshot Fallback'],
      tasksCompleted: 1420,
    },
    {
      id: 'agent_verifier',
      name: 'Link Verifier Agent',
      avatar: '🔗',
      role: 'Nationwide URL & Soft-404 Sentinel',
      status: 'Online',
      model: 'Async HTTP Probe Engine',
      workspace: '@shoppage/kernel/link_verifier',
      subtitle: '74,000 Verified Store Domains',
      skills: ['HEAD/GET Probe Pipeline', 'Soft-404 Classifier', 'Canonical Redirect Follower', 'Dead Link Retirement'],
      tasksCompleted: 8940,
    },
    {
      id: 'agent_change_detector',
      name: 'Change Detector Agent',
      avatar: '📉',
      role: 'Differential Price & Stock Watcher',
      status: 'Online',
      model: 'Differential Hashing Engine',
      workspace: '@shoppage/kernel/change_detector',
      subtitle: 'National BuyBox Matrix & Circulars',
      skills: ['ZAR Price Drop Alert', 'OOS Out-of-Stock Flag', 'Restock Trigger', 'BuyBox Shift Telemetry'],
      tasksCompleted: 452,
    },
    {
      id: 'agent_merchant_sourcing',
      name: 'Merchant Sourcing Agent',
      avatar: '🏬',
      role: 'CIPC Statutory & Spatial Hub Ingester',
      status: 'Online',
      model: 'CIPC Registry Parser + Geofence Matcher',
      workspace: '@shoppage/kernel/merchant_sourcing',
      subtitle: '3,296 Geofenced Shopping Centres',
      skills: ['CIPC Enterprise Number Check', 'Mall Polygon Geofencing', 'Spaza Spoke Mapping'],
      tasksCompleted: 74200,
    },
    {
      id: 'agent_news_circular',
      name: 'Retail News & Circular Agent',
      avatar: '📰',
      role: 'Weekly Flyer & Special Event Extractor',
      status: 'Online',
      model: 'Vision OCR + NLP Extraction',
      workspace: '@shoppage/kernel/retail_news',
      subtitle: 'Weekly Circulars (Makro, Game, Builders)',
      skills: ['PDF Circular OCR', 'Promotional Deal Parser', 'Special Expiry Sentinel'],
      tasksCompleted: 610,
    },
  ];

  const integrations: WakerIntegration[] = [
    {
      id: 'im_telegram_ops',
      name: 'Telegram SuperAdmin Incident Bot',
      type: 'Direct Bot',
      status: 'Connected',
      icon: '✈️',
      details: '@ShoppageOpsBot · High-priority 404 spikes & price drop alerts',
      badge: 'Active',
    },
    {
      id: 'im_slack_stewards',
      name: 'Bind Data Stewards & Engineering Ops',
      type: 'Group Chat',
      status: 'Connected',
      icon: '💼',
      details: '#shoppage-autonomous-grid · 18 Active Engineering Members',
      badge: 'Online',
    },
  ];

  const activities: WakerActivityItem[] = [
    {
      id: 'act_1',
      type: 'memory',
      categoryLabel: 'Memory Added',
      title: 'Risk Escalation: Soft-404 Threshold',
      subtitle: '>5 consecutive soft-404s demotes SERP rank',
      timestamp: '4 mins ago',
      icon: '🧠',
      badgeColor: '#10B981',
    },
    {
      id: 'act_2',
      type: 'automation',
      categoryLabel: 'Automation Run',
      title: 'Nationwide Link Sweep Complete',
      subtitle: '74,210 store endpoints probed in 3.2s',
      timestamp: '15 mins ago',
      icon: '⚡',
      badgeColor: '#3B82F6',
    },
    {
      id: 'act_3',
      type: 'task',
      categoryLabel: 'Task Created',
      title: 'Circular Ingestion: Makro Midrand',
      subtitle: '45 promotional products matched to GTIN-13',
      timestamp: '42 mins ago',
      icon: '📋',
      badgeColor: '#8B5CF6',
    },
    {
      id: 'act_4',
      type: 'evolution',
      categoryLabel: 'Skills Self-Evolution',
      title: 'prd_audit_standard',
      subtitle: 'Solar inverter capacity regex rule updated',
      timestamp: '1 hour ago',
      icon: '🌟',
      badgeColor: '#F59E0B',
    },
  ];

  return (
    <WakerWorkspaceView
      mode="admin"
      appTitle="QoderWake"
      workspaceTitle="Product Spec Review & National Grid Telemetry"
      workspaceBadge="Platform SuperAdmin"
      headerBrand="@Waker"
      headerSubtitle="Wake up your AI employee team"
      enableButtonText="+ Enable @Waker"
      agents={agents}
      integrations={integrations}
      activities={activities}
      step1={{
        title: 'Choose an IM connection',
        subtitle: 'Bot, personal account, or digital employee',
        icon: '🟢',
      }}
      step2={{
        title: 'Connect an IM conversation',
        subtitle: 'Group chats and direct messages',
        icon: '💬',
      }}
      step3={{
        title: 'Multiple Wakers collaborate',
        subtitle: 'Tasks, topics, and memory keep accumulating',
        icon: '👥',
      }}
      backLink={{
        href: '/admin/dashboard',
        label: 'Back to SuperAdmin Dashboard',
      }}
    />
  );
}
