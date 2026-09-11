'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface WakerAgent {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: 'Online' | 'Busy' | 'Idle' | 'Offline';
  model: string;
  workspace: string;
  isDefault?: boolean;
  subtitle?: string;
  systemPrompt?: string;
  skills?: string[];
  tasksCompleted?: number;
}

export interface WakerIntegration {
  id: string;
  name: string;
  type: string;
  status: 'Connected' | 'Pending' | 'Disconnected';
  icon: string;
  details: string;
  badge?: string;
}

export interface WakerActivityItem {
  id: string;
  type: 'memory' | 'automation' | 'task' | 'evolution';
  categoryLabel: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  icon: string;
  badgeColor?: string;
}

export interface WakerWorkspaceProps {
  mode: 'merchant' | 'admin';
  appTitle?: string;
  workspaceTitle: string;
  workspaceBadge: string;
  headerBrand: string;
  headerSubtitle: string;
  enableButtonText?: string;
  agents: WakerAgent[];
  integrations: WakerIntegration[];
  activities: WakerActivityItem[];
  step1: { title: string; subtitle: string; icon: string };
  step2: { title: string; subtitle: string; icon: string };
  step3: { title: string; subtitle: string; icon: string };
  backLink?: { href: string; label: string };
}

export default function WakerWorkspaceView({
  mode,
  appTitle = 'QoderWake',
  workspaceTitle,
  workspaceBadge,
  headerBrand,
  headerSubtitle,
  enableButtonText = '+ Enable @Waker',
  agents,
  integrations,
  activities,
  step1,
  step2,
  step3,
  backLink,
}: WakerWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'memory' | 'task' | 'config'>('overview');
  const [isWakerActive, setIsWakerActive] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<WakerAgent | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'wakers' | 'groups'>('wakers');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarNav, setActiveSidebarNav] = useState<'waker' | 'taskboard' | 'autonomous' | 'talent' | 'skills'>('waker');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-subtle)', display: 'flex', color: 'var(--color-content)', fontFamily: 'inherit' }}>
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR (Collapsible, Persona Roster, Navigation)
         ───────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarCollapsed ? '72px' : '260px',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-line)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          transition: 'width 0.2s ease',
          zIndex: 10,
        }}
      >
        {/* Brand & Collapse Header */}
        <div
          style={{
            padding: '1.25rem 1rem',
            borderBottom: '1px solid var(--color-line-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          }}
        >
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-on-solid)',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                }}
              >
                ⚡
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-content)', letterSpacing: '-0.01em' }}>
                {appTitle}
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-content-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '⇥' : '◨'}
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: sidebarCollapsed ? '0.75rem 0.25rem' : '1rem 0.75rem' }}>
          {/* Work Group */}
          {!sidebarCollapsed && (
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-content-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
              Work
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setActiveSidebarNav('taskboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: activeSidebarNav === 'taskboard' ? 'var(--color-surface-subtle)' : 'transparent',
                color: activeSidebarNav === 'taskboard' ? 'var(--color-content)' : 'var(--color-content-muted)',
                fontSize: '0.825rem',
                fontWeight: activeSidebarNav === 'taskboard' ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span>📋</span>
                {!sidebarCollapsed && <span>Task Board</span>}
              </div>
              {!sidebarCollapsed && (
                <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--color-brand-100)', color: 'var(--color-brand-700)', padding: '1px 6px', borderRadius: '10px' }}>
                  4
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSidebarNav('waker')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: activeSidebarNav === 'waker' ? 'var(--color-surface-subtle)' : 'transparent',
                color: activeSidebarNav === 'waker' ? 'var(--color-content)' : 'var(--color-content-muted)',
                fontSize: '0.825rem',
                fontWeight: activeSidebarNav === 'waker' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              <span style={{ color: 'var(--color-brand-ink)', fontWeight: 900 }}>@</span>
              {!sidebarCollapsed && <span>Waker</span>}
            </button>

            <button
              onClick={() => setActiveSidebarNav('autonomous')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: activeSidebarNav === 'autonomous' ? 'var(--color-surface-subtle)' : 'transparent',
                color: activeSidebarNav === 'autonomous' ? 'var(--color-content)' : 'var(--color-content-muted)',
                fontSize: '0.825rem',
                fontWeight: activeSidebarNav === 'autonomous' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              <span>💡</span>
              {!sidebarCollapsed && <span>Autonomous Work</span>}
            </button>
          </div>

          {/* Resource Group */}
          {!sidebarCollapsed && (
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-content-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
              Resource
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setActiveSidebarNav('talent')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: activeSidebarNav === 'talent' ? 'var(--color-surface-subtle)' : 'transparent',
                color: activeSidebarNav === 'talent' ? 'var(--color-content)' : 'var(--color-content-muted)',
                fontSize: '0.825rem',
                fontWeight: activeSidebarNav === 'talent' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              <span>👥</span>
              {!sidebarCollapsed && <span>Talent Market</span>}
            </button>

            <button
              onClick={() => setActiveSidebarNav('skills')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: activeSidebarNav === 'skills' ? 'var(--color-surface-subtle)' : 'transparent',
                color: activeSidebarNav === 'skills' ? 'var(--color-content)' : 'var(--color-content-muted)',
                fontSize: '0.825rem',
                fontWeight: activeSidebarNav === 'skills' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              <span>✨</span>
              {!sidebarCollapsed && <span>Skills & Resources</span>}
            </button>
          </div>

          {/* Switcher & Persona List */}
          {!sidebarCollapsed && (
            <>
              {/* Tab switcher: Waker (4) / Group (3) */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-line)', marginBottom: '0.75rem', paddingBottom: '0.25rem' }}>
                <button
                  onClick={() => setSidebarTab('wakers')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0',
                    border: 'none',
                    borderBottom: sidebarTab === 'wakers' ? '2px solid var(--color-content-secondary)' : '2px solid transparent',
                    background: 'none',
                    fontWeight: sidebarTab === 'wakers' ? 800 : 600,
                    fontSize: '0.78rem',
                    color: sidebarTab === 'wakers' ? 'var(--color-content)' : 'var(--color-content-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Waker ({agents.length})
                </button>
                <button
                  onClick={() => setSidebarTab('groups')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0',
                    border: 'none',
                    borderBottom: sidebarTab === 'groups' ? '2px solid var(--color-content-secondary)' : '2px solid transparent',
                    background: 'none',
                    fontWeight: sidebarTab === 'groups' ? 800 : 600,
                    fontSize: '0.78rem',
                    color: sidebarTab === 'groups' ? 'var(--color-content)' : 'var(--color-content-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Group ({mode === 'merchant' ? 2 : 3})
                </button>
              </div>

              {/* Manage Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-content-muted)', fontWeight: 600 }}>Manage All Employees</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-content-muted)' }}>&gt;</span>
              </div>

              {/* Persona List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.45rem 0.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedAgent?.id === agent.id ? 'var(--color-surface-subtle)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--color-surface-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          overflow: 'hidden',
                        }}
                      >
                        {agent.avatar}
                      </div>
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: agent.status === 'Online' ? 'var(--color-brand-500)' : 'var(--color-line-strong)',
                          border: '1.5px solid #FFFFFF',
                        }}
                      />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-content)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-content-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {agent.subtitle || agent.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Back link footer */}
        {backLink && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-line-subtle)' }}>
            <Link
              href={backLink.href}
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-content-muted)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 600,
              }}
            >
              <span>←</span>
              {!sidebarCollapsed && <span>{backLink.label}</span>}
            </Link>
          </div>
        )}
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
         ───────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', width: '100%' }}>
          {/* Top Hero Brand Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-content)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--color-brand-ink)', fontWeight: 900 }}>{headerBrand}</span>
                <span>{headerSubtitle}</span>
              </h1>
            </div>

            <button
              onClick={() => alert(`Active agents: ${agents.length}. Dispatching autonomous heartbeat to all connected channels.`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--color-content)',
                color: 'var(--color-content-inverse)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem 1.15rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'background 0.15s ease',
              }}
            >
              <span>+</span>
              <span>{enableButtonText}</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              3. GUIDED 3-STEP ONBOARDING RIBBON
             ───────────────────────────────────────────────────────────── */}
          <div
            style={{
              background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F8FAFC 100%)',
              border: '1px solid var(--color-brand-200)',
              borderRadius: '16px',
              padding: '1.25rem 1.75rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              boxShadow: '0 2px 8px -2px rgba(16, 185, 129, 0.08)',
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--color-brand-100)',
                padding: '0.85rem 1.1rem',
                flex: 1,
                minWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--color-brand-100)',
                  color: 'var(--color-brand-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                {step1.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--color-content)' }}>{step1.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-content-muted)', marginTop: '2px' }}>{step1.subtitle}</div>
              </div>
            </div>

            {/* Arrow Divider */}
            <div style={{ color: 'var(--color-brand-200)', fontSize: '1.25rem', fontWeight: 800 }}>→</div>

            {/* Step 2 */}
            <div
              style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--color-brand-100)',
                padding: '0.85rem 1.1rem',
                flex: 1,
                minWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--color-brand-100)',
                  color: 'var(--color-brand-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                {step2.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--color-content)' }}>{step2.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-content-muted)', marginTop: '2px' }}>{step2.subtitle}</div>
              </div>
            </div>

            {/* Arrow Divider */}
            <div style={{ color: 'var(--color-brand-200)', fontSize: '1.25rem', fontWeight: 800 }}>→</div>

            {/* Step 3 */}
            <div
              style={{
                background: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--color-brand-100)',
                padding: '0.85rem 1.1rem',
                flex: 1.3,
                minWidth: '260px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              {/* Overlapping Avatar Illustration Stack */}
              <div style={{ display: 'flex', position: 'relative', width: '56px', height: '36px', alignItems: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--color-warning-100)',
                    border: '2px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    zIndex: 1,
                  }}
                >
                  👩🏽‍💼
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: '14px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--color-brand-100)',
                    border: '2px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    zIndex: 2,
                  }}
                >
                  👨🏾‍💻
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: '28px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--color-brand-100)',
                    border: '2px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    zIndex: 3,
                  }}
                >
                  🕵️‍♂️
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--color-content)' }}>{step3.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-content-muted)', marginTop: '2px' }}>{step3.subtitle}</div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              4. WORKSPACE CONTROLS & SUB-TABS
             ───────────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--color-brand-ink)',
                  background: 'var(--color-brand-100)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                }}
              >
                {workspaceBadge}
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-content)', margin: 0 }}>
                {workspaceTitle}
              </h2>
            </div>

            {/* Toggle switch & Action Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* iOS-style toggle */}
                <div
                  onClick={() => setIsWakerActive(!isWakerActive)}
                  style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '12px',
                    background: isWakerActive ? 'var(--color-brand-500)' : 'var(--color-line-strong)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'var(--color-surface)',
                      position: 'absolute',
                      top: '2px',
                      left: isWakerActive ? '18px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isWakerActive ? 'var(--color-brand-ink)' : 'var(--color-content-muted)' }}>
                  @waker
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', color: 'var(--color-content-muted)', fontSize: '0.9rem' }}>
                <button
                  onClick={() => alert('Editing workspace settings...')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-content-muted)', padding: '4px' }}
                  title="Edit Workspace"
                >
                  ✏️
                </button>
                <button
                  onClick={() => alert('Focusing active workspace node...')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-content-muted)', padding: '4px' }}
                  title="Target Scope"
                >
                  🎯
                </button>
                <button
                  onClick={() => setActiveSubTab('config')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-content-muted)', padding: '4px' }}
                  title="Expert Configuration"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </div>

          {/* Sub-navigation tabs with underline indicator */}
          <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--color-line)', marginBottom: '1.75rem' }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'memory', label: 'Memory' },
              { id: 'task', label: 'Task' },
              { id: 'config', label: 'Expert Configuration' },
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  style={{
                    padding: '0.65rem 0.25rem',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--color-content-secondary)' : '2px solid transparent',
                    background: 'none',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.85rem',
                    color: isActive ? 'var(--color-content)' : 'var(--color-content-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SUB-TAB CONTENT
             ───────────────────────────────────────────────────────────── */}
          {activeSubTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* ─────────────────────────────────────────────────────────
                  5. ASSIGNED WAKER (Table)
                 ───────────────────────────────────────────────────────── */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-content)', margin: 0 }}>Assigned Waker</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-content-muted)' }}>
                    {agents.length} active agent{agents.length > 1 ? 's' : ''} assigned
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-line)',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-line)', color: 'var(--color-content-muted)' }}>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Waker</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Role</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Model</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Workspace</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((agent) => (
                        <tr
                          key={agent.id}
                          onClick={() => setSelectedAgent(agent)}
                          style={{
                            borderBottom: '1px solid var(--color-line-subtle)',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                          {/* Waker name + avatar + default tag */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: 'var(--color-surface-subtle)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.9rem',
                                }}
                              >
                                {agent.avatar}
                              </div>
                              <span style={{ fontWeight: 700, color: 'var(--color-content)' }}>{agent.name}</span>
                              {agent.isDefault && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    background: 'var(--color-surface-subtle)',
                                    color: 'var(--color-content-muted)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  Default
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-content-secondary)', fontWeight: 500 }}>
                            {agent.role}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  background: agent.status === 'Online' ? 'var(--color-brand-500)' : 'var(--color-line-strong)',
                                  display: 'inline-block',
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  color: agent.status === 'Online' ? 'var(--color-brand-ink)' : 'var(--color-content-muted)',
                                  fontWeight: 600,
                                }}
                              >
                                {agent.status}
                              </span>
                            </div>
                          </td>

                          {/* Model */}
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'var(--color-brand-50)',
                                color: 'var(--color-brand-700)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {agent.model}
                            </span>
                          </td>

                          {/* Workspace Path */}
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-content-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {agent.workspace}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ─────────────────────────────────────────────────────────
                  6. IM / INTEGRATIONS (Cards)
                 ───────────────────────────────────────────────────────── */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-content)', margin: 0 }}>IM</h3>
                  <button
                    onClick={() => alert('Connecting additional communication channels...')}
                    style={{ background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-ink)', cursor: 'pointer' }}
                  >
                    + Bind New Channel
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {integrations.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--color-surface)',
                        borderRadius: '12px',
                        border: '1px solid var(--color-line)',
                        padding: '1.1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'var(--color-surface-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-content)' }}>{item.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-content-muted)', marginTop: '2px' }}>{item.details}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: item.status === 'Connected' ? 'var(--color-brand-100)' : 'var(--color-warning-100)',
                            color: item.status === 'Connected' ? 'var(--color-brand-700)' : 'var(--color-warning-500)',
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ─────────────────────────────────────────────────────────
                  7. RECENT ACTIVITY (Horizontal Timeline)
                 ───────────────────────────────────────────────────────── */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-content)', margin: 0 }}>Recent Activity</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-content-muted)' }}>Live autonomous feed</span>
                </div>

                {/* Timeline Container */}
                <div
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-line)',
                    padding: '2rem 1.5rem',
                    overflowX: 'auto',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      minWidth: '700px',
                      padding: '2rem 1rem',
                    }}
                  >
                    {/* Connecting rail */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '40px',
                        right: '40px',
                        height: '2px',
                        background: 'var(--color-surface-subtle)',
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                      }}
                    />

                    {/* Timeline items */}
                    {activities.map((act, index) => {
                      const isEven = index % 2 === 0;
                      return (
                        <div
                          key={act.id}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative',
                            zIndex: 2,
                          }}
                        >
                          {/* Top Callout (for odd items) */}
                          {!isEven && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 'calc(100% + 14px)',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-line)',
                                borderRadius: '8px',
                                padding: '0.45rem 0.75rem',
                                width: '160px',
                                textAlign: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                              }}
                            >
                              <div style={{ fontSize: '0.65rem', color: 'var(--color-content-muted)', fontWeight: 700 }}>
                                {act.categoryLabel}
                              </div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-content)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {act.title}
                              </div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--color-content-muted)', marginTop: '2px' }}>
                                {act.timestamp}
                              </div>
                            </div>
                          )}

                          {/* Center Node Button/Icon */}
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--color-surface)',
                              border: `2px solid ${act.badgeColor || '#10B981'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                            }}
                          >
                            {act.icon}
                          </div>

                          {/* Bottom Callout (for even items) */}
                          {isEven && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 14px)',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-line)',
                                borderRadius: '8px',
                                padding: '0.45rem 0.75rem',
                                width: '160px',
                                textAlign: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                              }}
                            >
                              <div style={{ fontSize: '0.65rem', color: 'var(--color-content-muted)', fontWeight: 700 }}>
                                {act.categoryLabel}
                              </div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-content)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {act.title}
                              </div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--color-content-muted)', marginTop: '2px' }}>
                                {act.timestamp}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              MEMORY SUB-TAB
             ───────────────────────────────────────────────────────────── */}
          {activeSubTab === 'memory' && (
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-line)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>🧠 Active Working Memory & Rules</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-content-muted)', marginBottom: '1.5rem' }}>
                Stored context, learned buyer preferences, and domain parameters accumulating across autonomous interactions.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ border: '1px solid var(--color-line)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-content)' }}>
                      Pricing Escalation Threshold & Margin Floor
                    </span>
                    <span style={{ fontSize: '0.7rem', background: 'var(--color-brand-100)', color: 'var(--color-brand-700)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      Active
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-content-secondary)', margin: 0 }}>
                    Do not auto-generate wholesale proforma quotes below a 14% gross margin on battery inverters without merchant manual confirmation.
                  </p>
                </div>

                <div style={{ border: '1px solid var(--color-line)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-content)' }}>
                      CIPC Compliance & Tax Invoice Requirement
                    </span>
                    <span style={{ fontSize: '0.7rem', background: 'var(--color-brand-100)', color: 'var(--color-brand-700)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      Active
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-content-secondary)', margin: 0 }}>
                    Include verified CIPC Enterprise Number and SARS Tax PIN on all export orders dispatched via WhatsApp Quick Cart.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TASK SUB-TAB
             ───────────────────────────────────────────────────────────── */}
          {activeSubTab === 'task' && (
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-line)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>📋 Autonomous Task Queue</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-content-muted)', marginBottom: '1.5rem' }}>
                Currently queued and executing background jobs scheduled across the agent cluster.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { title: 'Google Merchant Center XML Feed Refresh', agent: 'Kagiso', status: 'Running', progress: '84%' },
                  { title: 'WhatsApp Quick Cart Inactive Order Follow-up', agent: 'Lindiwe', status: 'Queued', progress: 'Waiting' },
                  { title: 'Competitor Price Indexing · Crown Mines Wholesale Node', agent: 'Alexander', status: 'Complete', progress: '100%' },
                ].map((task, i) => (
                  <div key={i} style={{ border: '1px solid var(--color-line)', borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-content)' }}>{task.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-content-muted)', marginTop: '2px' }}>Assigned to: <strong>{task.agent}</strong></div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: task.status === 'Running' ? 'var(--color-brand-ink)' : task.status === 'Complete' ? 'var(--color-brand-700)' : 'var(--color-content-muted)' }}>
                      {task.status} ({task.progress})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              EXPERT CONFIGURATION SUB-TAB
             ───────────────────────────────────────────────────────────── */}
          {activeSubTab === 'config' && (
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-line)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>⚙️ Expert Configuration</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-content-muted)', marginBottom: '1.5rem' }}>
                Fine-tune model temperatures, system prompt guardrails, and runtime execution environments.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div style={{ border: '1px solid var(--color-line)', borderRadius: '8px', padding: '1rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-content)', display: 'block', marginBottom: '0.4rem' }}>
                    Primary Reasoning Engine
                  </label>
                  <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-line-strong)', fontSize: '0.825rem' }}>
                    <option>Gemini 3 Flash (High-Throughput)</option>
                    <option>DeepSeek V3 (Cost-Optimized)</option>
                    <option>In-Process SQLite FTS5 Rule Kernel</option>
                  </select>
                </div>

                <div style={{ border: '1px solid var(--color-line)', borderRadius: '8px', padding: '1rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-content)', display: 'block', marginBottom: '0.4rem' }}>
                    Autonomous Execution Interval
                  </label>
                  <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-line-strong)', fontSize: '0.825rem' }}>
                    <option>Continuous Event-Driven (Instant)</option>
                    <option>Every 15 Minutes</option>
                    <option>Hourly Sweep</option>
                    <option>Daily Digest (06:00 SAST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          8. AGENT DETAIL MODAL (When an agent is clicked)
         ───────────────────────────────────────────────────────────── */}
      {selectedAgent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={() => setSelectedAgent(null)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--color-surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                  }}
                >
                  {selectedAgent.avatar}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-content)', margin: 0 }}>
                    {selectedAgent.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-content-muted)', fontWeight: 600 }}>
                    {selectedAgent.role}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: 'var(--color-content-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.825rem' }}>
              <div style={{ background: 'var(--color-surface-subtle)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-line)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-content-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Workspace Scope</div>
                <div style={{ fontFamily: 'monospace', color: 'var(--color-content)', marginTop: '2px' }}>{selectedAgent.workspace}</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, background: 'var(--color-surface-subtle)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-line)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-content-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Model</div>
                  <div style={{ fontWeight: 800, color: 'var(--color-brand-700)', marginTop: '2px' }}>{selectedAgent.model}</div>
                </div>
                <div style={{ flex: 1, background: 'var(--color-surface-subtle)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-line)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-content-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontWeight: 800, color: 'var(--color-brand-700)', marginTop: '2px' }}>🟢 {selectedAgent.status}</div>
                </div>
              </div>

              {selectedAgent.skills && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-content-muted)', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Active Skills & Tools
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {selectedAgent.skills.map((s, i) => (
                      <span key={i} style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-700)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    alert(`Dispatched test autonomous prompt to ${selectedAgent.name}`);
                    setSelectedAgent(null);
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--color-content)',
                    color: 'var(--color-content-inverse)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Trigger Instant Run
                </button>
                <button
                  onClick={() => setSelectedAgent(null)}
                  style={{
                    background: 'var(--color-surface-subtle)',
                    color: 'var(--color-content)',
                    border: '1px solid var(--color-line-strong)',
                    borderRadius: '8px',
                    padding: '0.65rem 1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
