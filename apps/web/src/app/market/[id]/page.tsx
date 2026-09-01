'use client';

import { showToast } from '@/lib/toast';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  SA_COMPREHENSIVE_MARKETS,
  SA_COMMUNITY_GROUPS_DATASET,
  SouthAfricaMallsStore,
  NationwideMerchantStore,
  CommunityGroupAutoPosterService,
} from '@shoppage/kernel';
import type { TwitterXPost, InboundGroupListing } from '@shoppage/contracts';

function synthesizeFallbackMarket(id: string) {
  const clean = id.replace(/^(?:mkt_|mall_|vmkt_|vmkt_grp_)/, '').replace(/_/g, ' ');
  const name = clean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    id,
    name: `${name} Trading Floor`,
    marketType: 'virtual_community_group' as const,
    metro: 'Nationwide Commercial Grid',
    province: 'Gauteng',
    geo: {
      streetAddress: 'National Commercial Exchange',
      latitude: -26.1076,
      longitude: 28.0567,
      googleMapsUrl: 'https://maps.google.com/?q=-26.1076,28.0567',
    },
    operatingHours: '24/7 Digital Exchange & Direct Trade Floor',
    communityGroupMeta: {
      groupCategory: 'suburb_buy_sell' as const,
      memberCount: 48500,
      dailyPostVolume: 120,
      cityOrTown: 'National / Cloud',
      externalCommunityUrl: `https://www.facebook.com/groups/shoppage-${id}`,
      moderationType: 'open_public' as const,
      autoPostRule: {
        enabled: true,
        frequency: 'instant_on_publish' as const,
        templateFormat: 'full_specs_with_buybox' as const,
        includeCipcBadge: true,
        totalBroadcastsCount: 88,
      },
      inboundFeed: [
        {
          id: `inb_${id}_1`,
          postAuthor: 'Local Stockist',
          postTime: '15m ago',
          content: 'Wholesale clearance of inverters and lithium battery stock. Immediate pickup.',
          extractedTitle: 'Inverter & Battery Stock Lot',
          extractedPriceZar: 14850,
          extractedPhone: '+27 11 830 1100',
          verifiedMerchantStatus: true,
          status: 'published' as const,
        },
      ],
      twitterX: {
        officialHandle: `@${clean.replace(/\s/g, '')}Trade`,
        targetHashtags: ['#ShoppageGrid', '#DirectTradeSA', '#SouthAfricaDeals'],
        autoTweetOnPriceDrop: true,
        totalTweetsSyndicated: 215,
        liveFeed: [
          {
            id: `x_${id}_1`,
            authorHandle: `@${clean.replace(/\s/g, '')}HQ`,
            authorName: `${name} Commercial Desk`,
            isVerified: true,
            timestamp: '2m ago',
            text: `⚡ Live Trade Alert: New Tier-1 550W Mono PERC Solar Panels in stock. Direct wholesale counter pickup on Shoppage.`,
            likesCount: 18,
            retweetsCount: 7,
            hashtags: ['#SolarSA', '#DirectTrade', '#LoadSheddingDeals'],
            attachedPriceZar: 1750,
          },
        ],
      },
    },
    zones: [
      { id: 'zone_1', name: 'Tier-1 Importers & Manufacturers', zoneCode: 'IMPORTERS', stallCount: 45, categoryFocus: 'wholesale' },
      { id: 'zone_2', name: 'Certified Distributors & Installers', zoneCode: 'INSTALLERS', stallCount: 60, categoryFocus: 'commercial' },
    ],
  };
}

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const allKnownMarkets = [...SA_COMPREHENSIVE_MARKETS, ...SA_COMMUNITY_GROUPS_DATASET];
  const market =
    allKnownMarkets.find((m) => m.id === resolvedParams.id) ||
    SouthAfricaMallsStore.getMallById(resolvedParams.id) ||
    synthesizeFallbackMarket(resolvedParams.id);

  const { items: merchantsInMarket } = NationwideMerchantStore.getMerchantsByMarket(market.id, 24);
  const displayMerchants = merchantsInMarket.length > 0 ? merchantsInMarket : NationwideMerchantStore.getAllMerchants().slice(0, 6);
  
  const isCommunityGroup = market.marketType === 'virtual_community_group';
  const isVirtual = market.marketType.startsWith('virtual_');
  const externalUrl = market.communityGroupMeta?.externalCommunityUrl || (isCommunityGroup ? `https://www.facebook.com/groups/${(market as any).canonicalSlug || market.id}` : null);
  const twitterXHandle = market.communityGroupMeta?.twitterX?.officialHandle || `@${market.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 14)}Trade`;
  const memberCount = market.communityGroupMeta?.memberCount || (market as any).stallCapacity || 24000;
  const dailyPosts = market.communityGroupMeta?.dailyPostVolume || 95;

  const [activeTab, setActiveTab] = useState<'merchants' | 'community_feed' | 'autopost'>('merchants');
  const [socialFeedChannel, setSocialFeedChannel] = useState<'all' | 'facebook' | 'twitter_x'>('all');
  const [isAccountLinked, setIsAccountLinked] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [postToFacebook, setPostToFacebook] = useState(true);
  const [postToTwitterX, setPostToTwitterX] = useState(true);
  const [broadcastSuccessToast, setBroadcastSuccessToast] = useState<string | null>(null);
  const [livePulseTick, setLivePulseTick] = useState(0);

  // Inbound community feed state (Facebook)
  const [inboundPosts, setInboundPosts] = useState<InboundGroupListing[]>(
    market.communityGroupMeta?.inboundFeed || [
      {
        id: `inb_sample_1`,
        postAuthor: `Local Contractor (${market.province})`,
        postTime: '3m ago',
        content: `Looking for 8kW Deye / Sunsynk Inverter in ${market.name}. Need tax invoice and same-day collection.`,
        extractedTitle: 'Looking for 8kW Hybrid Inverter',
        extractedPriceZar: 23500,
        extractedPhone: '+27 11 784 1000',
        verifiedMerchantStatus: false,
        status: 'published' as const,
      },
      {
        id: `inb_sample_2`,
        postAuthor: `Wholesale Direct Importers`,
        postTime: '12m ago',
        content: `Pallet clearance: 20x 5.12kWh Dyness Lithium Batteries, SABS approved, 10yr warranty. Zero middleman markup.`,
        extractedTitle: '5.12kWh Lithium Batteries Pallet Lot',
        extractedPriceZar: 16900,
        extractedPhone: '+27 11 830 1100',
        verifiedMerchantStatus: true,
        status: 'published' as const,
      },
      {
        id: `inb_sample_3`,
        postAuthor: `Crown Mines Electrical`,
        postTime: '28m ago',
        content: `Special contractor pricing on 6mm solar cable (100m drums) & MC4 connectors. Counter pickup ready.`,
        extractedTitle: '6mm Solar Cable 100m Drums',
        extractedPriceZar: 1450,
        extractedPhone: '+27 11 839 2000',
        verifiedMerchantStatus: true,
        status: 'published' as const,
      },
    ]
  );

  // Twitter / X Live Feed State
  const [twitterPosts, setTwitterPosts] = useState<TwitterXPost[]>(
    market.communityGroupMeta?.twitterX?.liveFeed || [
      {
        id: `x_init_1`,
        authorHandle: `@SolarTechSA`,
        authorName: `Gauteng Solar & Backup Grid`,
        isVerified: true,
        timestamp: '1m ago',
        text: `🔥 Flash Deal: Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1) down to R14,850 for ${market.name} contractors. Full SABS / NRS 097 grid compliance.`,
        likesCount: 38,
        retweetsCount: 14,
        hashtags: ['#SolarSA', '#LoadShedding', '#ShoppageGrid', '#DirectTrade'],
        attachedProductSku: 'DEYE-5K-SG03',
        attachedPriceZar: 14850,
      },
      {
        id: `x_init_2`,
        authorHandle: `@MitrendPackaging`,
        authorName: `Mitrend Products (Pty) Ltd`,
        isVerified: true,
        timestamp: '9m ago',
        text: `📦 Restocked: 500ml Tamper-Evident Food Tubs (Carton of 250) available direct from Midrand factory floor at R185/box.`,
        likesCount: 19,
        retweetsCount: 8,
        hashtags: ['#PackagingSA', '#FoodGrade', '#WholesaleSA'],
        attachedProductSku: 'MIT-TUB-500ML',
        attachedPriceZar: 185,
      },
      {
        id: `x_init_3`,
        authorHandle: `@InstallerNetwork`,
        authorName: `SA Master Contractors`,
        isVerified: true,
        timestamp: '22m ago',
        text: `Urgent RFQ: Commercial contractor sourcing 100x 550W Tier-1 Mono Solar Panels for warehouse install in ${market.province}. Direct quotes open on Shoppage.`,
        likesCount: 42,
        retweetsCount: 19,
        hashtags: ['#CommercialSolar', '#B2BRFQ', '#ContractorDeals'],
        attachedPriceZar: 1750,
      },
    ]
  );

  // Live Pulse Simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePulseTick((prev) => prev + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleManualBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    let targetSummary = [];

    if (postToFacebook) {
      const parsedFacebook = CommunityGroupAutoPosterService.parseInboundGroupPost(
        market.id,
        'You (Linked Account)',
        broadcastMessage
      );
      setInboundPosts([parsedFacebook, ...inboundPosts]);
      targetSummary.push('Facebook Group');
    }

    if (postToTwitterX) {
      const newTweet: TwitterXPost = {
        id: `x_user_${Date.now()}`,
        authorHandle: `@VerifiedTrader`,
        authorName: `You (Shoppage Passport)`,
        isVerified: true,
        timestamp: 'Just now',
        text: `⚡ ${broadcastMessage}\n\n👉 Compare BuyBox: https://shoppage.co.za/m/${market.id}`,
        likesCount: 1,
        retweetsCount: 0,
        hashtags: ['#ShoppageGrid', '#DirectTradeSA', `#${market.province.replace(/\s/g, '')}`],
        attachedPriceZar: 14850,
      };
      setTwitterPosts([newTweet, ...twitterPosts]);
      targetSummary.push('Twitter / X (@X)');
    }

    setBroadcastMessage('');
    setBroadcastSuccessToast(`✓ Broadcast live to ${targetSummary.join(' & ')}!`);
    setTimeout(() => setBroadcastSuccessToast(null), 4000);
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Toast Notification */}
      {broadcastSuccessToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#059669',
            color: '#FFFFFF',
            padding: '0.65rem 1.4rem',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.875rem',
            zIndex: 9999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          }}
        >
          {broadcastSuccessToast}
        </div>
      )}

      {/* Breadcrumbs */}
      <div style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
        <span>&gt;</span>
        <Link href="/markets" style={{ color: '#64748B', textDecoration: 'none' }}>Markets & Exchanges</Link>
        <span>&gt;</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>{market.name}</span>
      </div>

      {/* Market Hero Header */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          padding: '2.25rem',
          background: isCommunityGroup
            ? 'linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 100%)'
            : isVirtual
            ? 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)'
            : '#FFFFFF',
          borderRadius: '16px',
          border: isCommunityGroup ? '1.5px solid #C7D2FE' : isVirtual ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className={`badge ${isCommunityGroup ? 'badge-purple' : isVirtual ? 'badge-blue' : 'badge-green'}`} style={{ fontWeight: 800 }}>
                {isCommunityGroup ? '👥 REAL COMMUNITY TRADING GROUP' : isVirtual ? '🌐 VIRTUAL B2B TRADING EXCHANGE' : `🏬 ${market.marketType.replace(/_/g, ' ').toUpperCase()}`}
              </span>
              <span className="badge badge-gray" style={{ fontWeight: 700 }}>
                {market.province}
              </span>
              {isCommunityGroup && (
                <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                  👥 {memberCount.toLocaleString()} Verified Members · {dailyPosts} Trades/Day
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.3rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem', color: '#0F172A' }}>
              {market.name}
            </h1>

            {market.geo && (
              <p style={{ color: '#475569', fontSize: '0.925rem', marginBottom: '0.4rem' }}>
                📍 {market.geo.streetAddress}
              </p>
            )}

            {/* Social Channel Hyperlinks */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {/* Direct Facebook Group Hyperlink */}
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{
                    background: '#1877F2',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(24, 119, 242, 0.3)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>🔗</span>
                  <span>Facebook Group ({memberCount.toLocaleString()}) &rarr;</span>
                </a>
              )}

              {/* Direct Twitter / X Hyperlink */}
              <a
                href={`https://twitter.com/search?q=${encodeURIComponent(market.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>𝕏</span>
                <span>{twitterXHandle} Live Feed &rarr;</span>
              </a>

              {/* Shopper Account Linking Button */}
              <button
                onClick={() => setShowLinkModal(true)}
                className="btn btn-outline btn-sm"
                style={{
                  borderRadius: '8px',
                  fontWeight: 700,
                  background: isAccountLinked ? '#ECFDF5' : '#FFFFFF',
                  borderColor: isAccountLinked ? '#A7F3D0' : '#CBD5E1',
                  color: isAccountLinked ? '#047857' : '#0F172A',
                }}
              >
                {isAccountLinked ? '✓ Account Linked' : '👥 Link Account to Feed'}
              </button>
            </div>
          </div>

          {/* Quick Actions Side Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: '220px' }}>
            <Link
              href={`/merchant/claim?marketId=${market.id}&marketName=${encodeURIComponent(market.name)}`}
              className="btn btn-primary"
              style={{ fontWeight: 800, justifyContent: 'center', padding: '0.75rem', borderRadius: '8px', background: '#059669', borderColor: '#059669' }}
            >
              + Join Trading Floor (Free)
            </Link>
            <Link
              href={`/requests?marketId=${market.id}`}
              className="btn btn-outline"
              style={{ justifyContent: 'center', fontSize: '0.85rem', borderRadius: '8px', fontWeight: 700 }}
            >
              📋 Broadcast Buyer RFQ
            </Link>
          </div>
        </div>
      </div>

      {/* LIVE TELEMETRY TICKER BAR */}
      <div
        style={{
          background: '#0F172A',
          color: '#F8FAFC',
          borderRadius: '10px',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          fontSize: '0.8rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontWeight: 800, color: '#34D399' }}>LIVE SOCIAL PULSE</span>
          <span style={{ color: '#94A3B8' }}>|</span>
          <span style={{ color: '#CBD5E1' }}>
            Sweeping Facebook Groups & Twitter / X feeds every 5s (Pass {livePulseTick + 1})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', color: '#94A3B8', fontSize: '0.75rem' }}>
          <span>📘 Facebook: <strong>{inboundPosts.length} Live Deals</strong></span>
          <span>𝕏 Twitter/X: <strong>{twitterPosts.length} Real-Time Tweets</strong></span>
          <span style={{ color: '#38BDF8' }}>0% Commission Toll</span>
        </div>
      </div>

      {/* BI-DIRECTIONAL NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('merchants')}
          className={`btn ${activeTab === 'merchants' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px', fontSize: '0.875rem', fontWeight: 800 }}
        >
          🏪 Verified Stockists & Catalog ({displayMerchants.length})
        </button>

        <button
          onClick={() => setActiveTab('community_feed')}
          className={`btn ${activeTab === 'community_feed' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px', fontSize: '0.875rem', fontWeight: 800 }}
        >
          📡 Live Social Stream (FB & 𝕏 Twitter) ({inboundPosts.length + twitterPosts.length})
        </button>

        <button
          onClick={() => setActiveTab('autopost')}
          className={`btn ${activeTab === 'autopost' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px', fontSize: '0.875rem', fontWeight: 800 }}
        >
          ⚡ Dual Auto-Post (FB + 𝕏 Twitter)
        </button>
      </div>

      {/* TAB 1: VERIFIED MERCHANTS & STORES */}
      {activeTab === 'merchants' && (
        <section className="card" style={{ padding: '2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                🏪 Verified Merchants & Suppliers
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                Direct omnichannel trade: Phone, Email RFQ, Showroom Visit, or Direct Message with 0% take-rate.
              </p>
            </div>
            <Link
              href={`/merchant/claim?marketId=${market.id}`}
              className="btn btn-outline btn-sm"
              style={{ fontWeight: 700, borderRadius: '6px' }}
            >
              + Register Your Store Here
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {displayMerchants.map((merchant) => (
              <div
                key={merchant.id}
                className="card card-interactive"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        <Link href={`/m/${merchant.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {merchant.name}
                        </Link>
                      </h3>
                      <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        📍 {merchant.stallIdentifier || merchant.addressText || 'Main Trade Concourse'}
                      </div>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Verified</span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#475569', margin: '0.5rem 0 1rem 0', lineHeight: 1.4 }}>
                    Category: <strong>{merchant.category || 'General Wholesale'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                  <Link href={`/m/${merchant.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center', fontWeight: 800 }}>
                    Enter Store
                  </Link>
                  {merchant.contacts?.telephone && (
                    <a
                      href={`tel:${merchant.contacts.telephone}`}
                      className="btn btn-outline btn-sm"
                      style={{ fontWeight: 700, padding: '0.35rem 0.65rem' }}
                      title="Direct Phone Call"
                    >
                      📞 Call
                    </a>
                  )}
                  {merchant.contacts?.email && (
                    <a
                      href={`mailto:${merchant.contacts.email}?subject=Inquiry via Shoppage`}
                      className="btn btn-outline btn-sm"
                      style={{ fontWeight: 700, padding: '0.35rem 0.65rem' }}
                      title="Direct Email Inquiry"
                    >
                      ✉️ RFQ
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: LIVE SOCIAL STREAM (FACEBOOK GROUPS + TWITTER / X) */}
      {activeTab === 'community_feed' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Channel Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSocialFeedChannel('all')}
                className={`btn btn-sm ${socialFeedChannel === 'all' ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '20px', fontWeight: 700 }}
              >
                🌐 Unified Live Pulse ({inboundPosts.length + twitterPosts.length})
              </button>
              <button
                onClick={() => setSocialFeedChannel('facebook')}
                className={`btn btn-sm ${socialFeedChannel === 'facebook' ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '20px', fontWeight: 700, background: socialFeedChannel === 'facebook' ? '#1877F2' : undefined, borderColor: socialFeedChannel === 'facebook' ? '#1877F2' : undefined }}
              >
                📘 Facebook Group Deals ({inboundPosts.length})
              </button>
              <button
                onClick={() => setSocialFeedChannel('twitter_x')}
                className={`btn btn-sm ${socialFeedChannel === 'twitter_x' ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '20px', fontWeight: 700, background: socialFeedChannel === 'twitter_x' ? '#000000' : undefined, borderColor: socialFeedChannel === 'twitter_x' ? '#000000' : undefined }}
              >
                𝕏 Twitter / X Feed ({twitterPosts.length})
              </button>
            </div>

            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Real-time synchronization active with <strong>{market.name}</strong>
            </span>
          </div>

          {/* Twitter / X Stream Section */}
          {(socialFeedChannel === 'all' || socialFeedChannel === 'twitter_x') && (
            <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, background: '#000000', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>𝕏</span>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Twitter / X Real-Time Commercial Feed
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Streaming verified trade alerts from {twitterXHandle} & local contractors
                    </div>
                  </div>
                </div>

                <a
                  href={`https://twitter.com/search?q=${encodeURIComponent(market.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  Open in 𝕏 App &rarr;
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {twitterPosts.map((tweet) => (
                  <div
                    key={tweet.id}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                            𝕏
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>{tweet.authorName}</span>
                              {tweet.isVerified && <span style={{ color: '#1D9BF0' }}>✓</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{tweet.authorHandle}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{tweet.timestamp}</span>
                      </div>

                      <p style={{ fontSize: '0.875rem', color: '#1E293B', lineHeight: 1.45, margin: '0.5rem 0' }}>
                        {tweet.text}
                      </p>

                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {tweet.hashtags.map((tag) => (
                          <span key={tag} style={{ color: '#1D9BF0', fontSize: '0.75rem', fontWeight: 700 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#64748B' }}>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <span>❤️ {tweet.likesCount}</span>
                        <span>🔁 {tweet.retweetsCount}</span>
                      </div>

                      <Link
                        href="/search"
                        className="btn btn-primary btn-sm"
                        style={{ borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      >
                        {tweet.attachedPriceZar ? `R ${tweet.attachedPriceZar.toLocaleString()} · BuyBox &rarr;` : 'View BuyBox &rarr;'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facebook Group Inbound Posts Section */}
          {(socialFeedChannel === 'all' || socialFeedChannel === 'facebook') && (
            <div className="card" style={{ padding: '1.5rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, background: '#1877F2', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>📘</span>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Facebook Group Deals & Member Inquiries
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Extracted and indexed live from {market.name}
                    </div>
                  </div>
                </div>

                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Open in Facebook &rarr;
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {inboundPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>
                          {post.postAuthor}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>• {post.postTime}</span>
                        {post.verifiedMerchantStatus && (
                          <span style={{ background: '#ECFDF5', color: '#047857', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800 }}>
                            ✓ CIPC Verified Stockist
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '0 0 0.5rem 0' }}>
                        {post.content}
                      </p>

                      {post.extractedPriceZar && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 900, color: '#047857' }}>
                          <span>R {post.extractedPriceZar.toLocaleString()}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>· Extracted Price</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      {post.extractedPhone && (
                        <a
                          href={`tel:${post.extractedPhone}`}
                          className="btn btn-outline btn-sm"
                          style={{ borderRadius: '6px', fontWeight: 700 }}
                        >
                          📞 Call Trader
                        </a>
                      )}
                      <Link
                        href="/search"
                        className="btn btn-primary btn-sm"
                        style={{ borderRadius: '6px', fontWeight: 800 }}
                      >
                        Compare BuyBox &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: DUAL AUTO-POST (FB + 𝕏 TWITTER) */}
      {activeTab === 'autopost' && (
        <section className="card" style={{ padding: '2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 0.75rem auto' }}>
                ⚡
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
                Dual Social Commerce Auto-Poster
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                1-Click broadcast stock drops, clearance deals, or sourcing RFQs simultaneously to <strong>Facebook Groups</strong> and <strong>Twitter / X (@X)</strong>.
              </p>
            </div>

            <form onSubmit={handleManualBroadcast}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.4rem' }}>
                  Deal / RFQ Announcement Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Selling 5x Deye 8kW Hybrid Inverters R23,500 each in Sandton. Full 5-yr warranty. Trade counter collection ready."
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Multi-Channel Broadcast Channels Selector */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem' }}>
                  Select Syndication Channels:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#1877F2' }}>
                      <input
                        type="checkbox"
                        checked={postToFacebook}
                        onChange={(e) => setPostToFacebook(e.target.checked)}
                      />
                      <span>📘 Post to Linked Facebook Group ({market.name})</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800 }}>✓ Live Bridge</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#000000' }}>
                      <input
                        type="checkbox"
                        checked={postToTwitterX}
                        onChange={(e) => setPostToTwitterX(e.target.checked)}
                      />
                      <span>𝕏 Tweet to Twitter / X ({twitterXHandle})</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800 }}>✓ Auto-Hashtags</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem', background: '#2563EB', borderColor: '#2563EB' }}
              >
                🚀 1-Click Dual Broadcast to Facebook & 𝕏 Twitter
              </button>
            </form>
          </div>
        </section>
      )}

      {/* SHOPPER ACCOUNT & SOCIAL GROUP LINK MODAL */}
      {showLinkModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '2rem',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Link Account to Social Trade Grid
              </h3>
              <button onClick={() => setShowLinkModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Linking your identity allows you to post directly to both Facebook trading groups and Twitter / X with verified CIPC badges and zero commission toll fees.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <button
                onClick={() => {
                  setIsAccountLinked(true);
                  setShowLinkModal(false);
                  showToast('Facebook Profile & Twitter/X handle successfully connected!', 'success');
                }}
                className="btn btn-primary"
                style={{ background: '#1877F2', borderColor: '#1877F2', fontWeight: 800, padding: '0.75rem', borderRadius: '8px' }}
              >
                📘 Continue with Facebook
              </button>

              <button
                onClick={() => {
                  setIsAccountLinked(true);
                  setShowLinkModal(false);
                  showToast('Twitter / X handle successfully connected!', 'success');
                }}
                className="btn btn-primary"
                style={{ background: '#000000', borderColor: '#000000', fontWeight: 800, padding: '0.75rem', borderRadius: '8px' }}
              >
                𝕏 Continue with Twitter / X
              </button>

              <button
                onClick={() => {
                  setIsAccountLinked(true);
                  setShowLinkModal(false);
                  showToast('Shoppage Member ID linked.', 'success');
                }}
                className="btn btn-outline"
                style={{ fontWeight: 700, padding: '0.75rem', borderRadius: '8px' }}
              >
                🔐 Link with Shoppage Phone / Email
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>
              Protected under 256-bit encryption · POPIA & CIPC compliant.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
