'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import FeedPostCard from './FeedPost';
import {
  getShorts,
  getMarkets,
  getProductsCatalog,
  formatZar,
  type PostItem,
  type MarketItem,
  type ProductCatalogItem,
  type RetailSpecial,
  type ShortItem,
} from '@/lib/feed';
import PostDetailModal from './PostDetailModal';
import MarketDetailModal from './MarketDetailModal';
import ShortsViewerModal from './ShortsViewerModal';

type TabType = 'foryou' | 'products' | 'deals' | 'markets' | 'shorts';
type ViewType = 'home' | 'bookmarks';

const CIRC = 62.83;

const SA_PROVINCES = [
  { id: 'all', label: 'All Provinces' },
  { id: 'Gauteng', label: 'Gauteng' },
  { id: 'Western Cape', label: 'Western Cape' },
  { id: 'KwaZulu-Natal', label: 'KwaZulu-Natal' },
  { id: 'Eastern Cape', label: 'Eastern Cape' },
  { id: 'Limpopo', label: 'Limpopo' },
  { id: 'Mpumalanga', label: 'Mpumalanga' },
  { id: 'Free State', label: 'Free State' },
  { id: 'North West', label: 'North West' },
];

const SHORTS_CATEGORIES = [
  { id: 'all', label: 'All Trade Reels' },
  { id: 'solar', label: '⚡ Solar & Power' },
  { id: 'tech', label: '📱 Phones & Tech' },
  { id: 'markets', label: '🏢 Wholesale Markets' },
  { id: 'auto', label: '🚗 Spares & Auto' },
  { id: 'fmcg', label: '🛒 Bulk FMCG' },
  { id: 'packaging', label: '📦 Packaging' },
];

const PRODUCT_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'solar', label: '⚡ Solar & Power' },
  { id: 'electronics', label: '📱 Phones & Tech' },
  { id: 'packaging', label: '📦 Packaging & Catering' },
  { id: 'hardware', label: '🧱 Building & Hardware' },
  { id: 'automotive', label: '🚗 Automotive Spares' },
  { id: 'fmcg', label: '🛒 Wholesale FMCG' },
];

const DEAL_RETAILERS = [
  { id: 'all', label: 'All Major Retailers' },
  { id: 'buco', label: '🟡 BUCO (558 Deals)' },
  { id: 'spar', label: '🟢 SPAR (141 Deals)' },
  { id: 'game', label: '🔵 Game (93 Deals)' },
  { id: 'builders', label: '🟠 Builders (69 Deals)' },
  { id: 'bradlows', label: '🟤 Bradlows (59 Deals)' },
  { id: 'russells', label: '🔴 Russells (55 Deals)' },
  { id: 'leroy', label: '🟢 Leroy Merlin (40 Deals)' },
  { id: 'expert', label: '🔵 Expert Stores (31 Deals)' },
  { id: 'makro', label: '🔴 Makro (24 Deals)' },
  { id: 'takealot', label: '🔵 Takealot (18 Deals)' },
  { id: 'pep', label: '🟡 PEP Stores (12 Deals)' },
  { id: 'dischem', label: '🟢 Dis-Chem (12 Deals)' },
  { id: 'solar', label: '⚡ SolarAdvice (9 Deals)' },
  { id: 'clicks', label: '🔵 Clicks Group (2 Deals)' },
  { id: 'checkers', label: '🟢 Checkers Sixty60' },
  { id: 'pnp', label: '🔴 Pick n Pay' },
  { id: 'woolworths', label: '⚫ Woolworths' },
];

const DEAL_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'groceries', label: '🛒 Groceries & FMCG' },
  { id: 'solar_energy', label: '⚡ Solar & Inverters' },
  { id: 'electronics', label: '📱 Phones & Tech' },
  { id: 'hardware', label: '🧱 Building & Tools' },
  { id: 'appliances', label: '🍳 Appliances' },
  { id: 'health_beauty', label: '💊 Health & Beauty' },
];

export default function DiscoveryFeed({
  posts: initialPosts,
  specials = [],
  initialProducts = [],
}: {
  posts: PostItem[];
  specials?: RetailSpecial[];
  initialProducts?: ProductCatalogItem[];
}) {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [tab, setTab] = useState<TabType>('foryou');
  const [view, setView] = useState<ViewType>('home');
  const [search, setSearch] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');

  // Deals tab state (Guzzle-Style Circular Specials with Direct Retailer URLs)
  const [dealRetailer, setDealRetailer] = useState('all');
  const [dealCategory, setDealCategory] = useState('all');
  const [dealSearch, setDealSearch] = useState('');
  const [dealSort, setDealSort] = useState<'discount' | 'price_asc' | 'price_desc'>('discount');
  const [dealViewMode, setDealViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleDealsCount, setVisibleDealsCount] = useState(48);

  // Products tab state
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategory, setProdCategory] = useState('all');
  const [prodSort, setProdSort] = useState<'drop' | 'price_asc' | 'price_desc' | 'sellers'>('drop');
  const [prodViewMode, setProdViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleProductsCount, setVisibleProductsCount] = useState(48);

  // Modals state
  const [selectedPostDetail, setSelectedPostDetail] = useState<PostItem | null>(null);
  const [selectedMarketDetail, setSelectedMarketDetail] = useState<MarketItem | null>(null);
  const [selectedShortModal, setSelectedShortModal] = useState<ShortItem | null>(null);

  // Markets tab state
  const [marketSubFilter, setMarketSubFilter] = useState<'all' | 'fav' | 'wholesale' | 'malls' | 'transit'>('all');
  const [marketProvince, setMarketProvince] = useState('all');
  const [marketViewMode, setMarketViewMode] = useState<'grid' | 'list'>('grid');
  const [marketSearch, setMarketSearch] = useState('');
  const [favMarkets, setFavMarkets] = useState<Record<string, boolean>>({});
  const [followedMarkets, setFollowedMarkets] = useState<Record<string, boolean>>({});

  // Shorts tab state
  const [shortsCategory, setShortsCategory] = useState('all');

  // Composer Poll state
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');
  const [pollOpt3, setPollOpt3] = useState('');

  // Reaction states
  const [liked, setLiked] = useState<Record<string | number, boolean>>({});
  const [reposted, setReposted] = useState<Record<string | number, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string | number, boolean>>({});
  const [playingShortId, setPlayingShortId] = useState<string | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Memos
  const shorts = useMemo(() => getShorts(), []);
  const allMarkets = useMemo(() => getMarkets(), []);
  const allProducts = useMemo(() => {
    if (initialProducts && initialProducts.length > 0) return initialProducts;
    return getProductsCatalog();
  }, [initialProducts]);

  // Effects
  useEffect(() => {
    setVisibleDealsCount(48);
  }, [dealRetailer, dealCategory, dealSearch, dealSort]);

  useEffect(() => {
    setVisibleProductsCount(48);
  }, [prodCategory, prodSearch, prodSort]);

  // Sync active tab with localStorage & custom event for CommerceRail
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('shoppage-active-tab', {
        detail: {
          tab,
          retailer: dealRetailer,
          category: prodCategory,
          marketFilter: marketSubFilter,
        },
      })
    );
    try {
      localStorage.setItem('shoppage_active_tab', tab);
    } catch {}
  }, [tab, dealRetailer, prodCategory, marketSubFilter]);

  // Sync live deals data with CommerceRail
  useEffect(() => {
    if (specials && specials.length > 0) {
      const topDrops = specials
        .filter((s) => typeof s.dropPct === 'number' && s.dropPct > 0)
        .sort((a, b) => (b.dropPct || 0) - (a.dropPct || 0))
        .slice(0, 6);

      window.dispatchEvent(
        new CustomEvent('shoppage-deals-sync', {
          detail: {
            totalDeals: specials.length,
            activeRetailer: dealRetailer,
            topDrops,
          },
        })
      );
    }
  }, [specials, dealRetailer]);

  // Sync live products data with CommerceRail
  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      const topProducts = allProducts
        .filter((p) => typeof p.price === 'number' && p.price > 0)
        .slice(0, 6)
        .map((p) => ({
          id: p.id,
          title: p.title,
          brand: p.brand,
          merchant: p.stockistLocation?.split('·')[0]?.trim() || p.brand,
          priceText: formatZar(p.price),
          dropPct: p.dropPct,
          image: p.image,
          url: p.href,
        }));

      window.dispatchEvent(
        new CustomEvent('shoppage-products-sync', {
          detail: {
            totalProducts: allProducts.length,
            activeCategory: prodCategory,
            topProducts,
          },
        })
      );
    }
  }, [allProducts, prodCategory]);

  // Sync live markets data with CommerceRail
  useEffect(() => {
    if (allMarkets && allMarkets.length > 0) {
      window.dispatchEvent(
        new CustomEvent('shoppage-markets-sync', {
          detail: {
            totalMarkets: allMarkets.length,
            activeFilter: marketSubFilter,
          },
        })
      );
    }
  }, [allMarkets, marketSubFilter]);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastOn(false);
    }, 2600);
  };

  // Load saved favourites, follows, user posts, and reactions from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('shoppage_fav_markets');
      if (savedFavs) setFavMarkets(JSON.parse(savedFavs));

      const savedFollows = localStorage.getItem('shoppage_followed_markets');
      if (savedFollows) setFollowedMarkets(JSON.parse(savedFollows));

      const savedLikes = localStorage.getItem('shoppage_liked_posts');
      if (savedLikes) setLiked(JSON.parse(savedLikes));

      const savedReposts = localStorage.getItem('shoppage_reposted_posts');
      if (savedReposts) setReposted(JSON.parse(savedReposts));

      const savedBookmarks = localStorage.getItem('shoppage_bookmarked_posts');
      if (savedBookmarks) setBookmarked(JSON.parse(savedBookmarks));

      const savedUserPosts = localStorage.getItem('shoppage_user_posts');
      if (savedUserPosts) {
        const parsed: PostItem[] = JSON.parse(savedUserPosts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts((current) => [...parsed, ...current]);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Sync with window events from navbar or commerce rail
  useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      const { type, query, retailer, category, mode, sort } = e.detail || {};
      if (type === 'tab') {
        setTab(query as TabType);
        setView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'bookmarks') {
        setView('bookmarks');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'search') {
        setSearch(query || '');
        if (tab === 'products') {
          setProdSearch(query || '');
        } else if (tab === 'deals') {
          setDealSearch(query || '');
        }
      } else if (type === 'deal-retailer') {
        setTab('deals');
        setDealRetailer(retailer || query || 'all');
        setView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'deal-category') {
        setTab('deals');
        setDealCategory(category || query || 'all');
        setView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'deal-search') {
        setTab('deals');
        setDealSearch(query || '');
        setView('home');
      } else if (type === 'deal-view-mode') {
        setDealViewMode(mode || 'grid');
      } else if (type === 'deal-sort') {
        if (sort) setDealSort(sort);
      } else if (type === 'prod-view-mode') {
        setProdViewMode(mode || 'grid');
      } else if (type === 'prod-category') {
        setTab('products');
        setProdCategory(category || query || 'all');
        setView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'prod-search') {
        setTab('products');
        setProdSearch(query || '');
        setView('home');
      } else if (type === 'prod-sort') {
        if (sort) setProdSort(sort);
      } else if (type === 'market-filter') {
        setTab('markets');
        setMarketSubFilter((mode || query || 'all') as any);
        setView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'market-search') {
        setTab('markets');
        setMarketSearch(query || '');
        setView('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (type === 'focus-composer') {
        if (tab === 'products' || tab === 'markets' || tab === 'shorts' || tab === 'deals') {
          setTab('foryou');
        }
        setTimeout(() => {
          textareaRef.current?.focus();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }
    };

    window.addEventListener('shoppage-nav' as any, handleCustomEvent);
    return () => window.removeEventListener('shoppage-nav' as any, handleCustomEvent);
  }, [tab]);

  // Toggle market favourite
  const toggleFavMarket = (id: string, name: string) => {
    const next = !favMarkets[id];
    const updated = { ...favMarkets, [id]: next };
    setFavMarkets(updated);
    try {
      localStorage.setItem('shoppage_fav_markets', JSON.stringify(updated));
    } catch {}
    toast(next ? `⭐ Added ${name} to your favoured markets` : `Removed ${name} from favourites`);
  };

  // Toggle market follow
  const toggleFollowMarket = (id: string, name: string) => {
    const next = !followedMarkets[id];
    const updated = { ...followedMarkets, [id]: next };
    setFollowedMarkets(updated);
    try {
      localStorage.setItem('shoppage_followed_markets', JSON.stringify(updated));
    } catch {}
    toast(next ? `Following ${name}` : `Unfollowed ${name}`);
  };

  // Textarea resizing
  const handleComposerInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setComposerText(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Character counter ring calculation
  const charLen = composerText.length;
  const isOver = charLen > 280;
  const isNear = 280 - charLen <= 20;
  const ringUsed = Math.min(charLen, 280);
  const ringOffset = CIRC * (1 - ringUsed / 280);
  const ringColor = isOver ? 'var(--red)' : isNear ? 'var(--gold)' : 'var(--blue)';

  const handlePostSubmit = async () => {
    const trimmed = composerText.trim();
    if (!trimmed || trimmed.length > 280) return;

    let pollPayload: PostItem['poll'] = undefined;
    if (isPollOpen && pollOpt1.trim() && pollOpt2.trim()) {
      const opts = [
        { l: pollOpt1.trim(), v: 0 },
        { l: pollOpt2.trim(), v: 0 },
      ];
      if (pollOpt3.trim()) {
        opts.push({ l: pollOpt3.trim(), v: 0 });
      }
      pollPayload = {
        options: opts,
        voted: null,
      };
    }

    const fullText = replyTo ? `Replying to ${replyTo}\n${trimmed}` : trimmed;
    const newPost: PostItem = {
      id: `usr_${Date.now()}`,
      name: 'You (Verified Trader)',
      handle: '@you_za',
      av: 'g8',
      ini: 'Y',
      verified: true,
      time: 'now',
      tabs: ['foryou', 'deals'],
      text: fullText,
      poll: pollPayload,
      stats: { replies: 0, reposts: 0, likes: 0, views: '1' },
    };

    setPosts((prev) => [newPost, ...prev]);
    setComposerText('');
    setReplyTo(null);
    setIsPollOpen(false);
    setPollOpt1('');
    setPollOpt2('');
    setPollOpt3('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    toast('⚡ Trade broadcast live to Shoppage stream');

    // Persist post locally so it stays across reloads
    try {
      const savedUserPosts = localStorage.getItem('shoppage_user_posts');
      const existing: PostItem[] = savedUserPosts ? JSON.parse(savedUserPosts) : [];
      localStorage.setItem('shoppage_user_posts', JSON.stringify([newPost, ...existing]));
    } catch {}

    // Dispatch to backend API
    try {
      await fetch('/api/v1/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCategory: 'social_trade_broadcast',
          itemSummary: trimmed,
          buyerContact: {
            name: 'Verified Trade Desk',
            phone: '+27 10 500 7670',
          },
        }),
      });
    } catch {}
  };

  // Interaction handlers
  const handleLike = (id: string | number) => {
    setLiked((prev) => {
      const next = !prev[id];
      const updated = { ...prev, [id]: next };
      try {
        localStorage.setItem('shoppage_liked_posts', JSON.stringify(updated));
      } catch {}
      toast(next ? 'Liked deal' : 'Unliked');
      return updated;
    });
  };

  const handleRepost = (id: string | number) => {
    setReposted((prev) => {
      const next = !prev[id];
      const updated = { ...prev, [id]: next };
      try {
        localStorage.setItem('shoppage_reposted_posts', JSON.stringify(updated));
      } catch {}
      toast(next ? 'Reposted to your trade profile' : 'Undo repost');
      return updated;
    });
  };

  const handleBookmark = (id: string | number) => {
    setBookmarked((prev) => {
      const next = !prev[id];
      const updated = { ...prev, [id]: next };
      try {
        localStorage.setItem('shoppage_bookmarked_posts', JSON.stringify(updated));
      } catch {}
      toast(next ? 'Saved to Bookmarks' : 'Removed from Bookmarks');
      return updated;
    });
  };

  const handleReply = (handle: string) => {
    setReplyTo(handle);
    textareaRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGetDeal = (post: PostItem) => {
    setSelectedPostDetail(post);
  };



  // Filter timeline posts
  const filteredPosts = useMemo(() => {
    let list = posts;

    if (view === 'bookmarks') {
      return list.filter((p) => bookmarked[p.id]);
    }

    if (tab === 'deals') {
      list = list.filter((p) => p.tabs.includes('deals'));
    } else if (tab === 'foryou') {
      list = list.filter((p) => p.tabs.includes('foryou'));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.text.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          (p.product && p.product.name.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [posts, tab, view, search, bookmarked]);

  // Filter & sort major retailer deals (Guzzle-style circular aggregator)
  const filteredSpecials = useMemo(() => {
    let list = specials;

    if (dealRetailer !== 'all') {
      list = list.filter((s) => {
        const m = s.merchant.toLowerCase();
        const d = (s.retailerDomain || '').toLowerCase();
        if (dealRetailer === 'buco') return m.includes('buco') || d.includes('buco');
        if (dealRetailer === 'spar') return m.includes('spar') || d.includes('spar');
        if (dealRetailer === 'expert') return m.includes('expert') || d.includes('expert');
        if (dealRetailer === 'bradlows') return m.includes('bradlows') || d.includes('bradlows');
        if (dealRetailer === 'russells') return m.includes('russells') || d.includes('russells');
        if (dealRetailer === 'pep') return m.includes('pep') || d.includes('pep');
        if (dealRetailer === 'makro') return m.includes('makro') || d.includes('makro');
        if (dealRetailer === 'game') return m.includes('game') || d.includes('game');
        if (dealRetailer === 'builders') return m.includes('builders') || d.includes('builders');
        if (dealRetailer === 'checkers') return m.includes('checkers') || d.includes('checkers');
        if (dealRetailer === 'pnp') return m.includes('pick n pay') || d.includes('pnp');
        if (dealRetailer === 'woolworths') return m.includes('woolworths') || d.includes('woolworths');
        if (dealRetailer === 'takealot') return m.includes('takealot') || d.includes('takealot');
        if (dealRetailer === 'clicks') return m.includes('clicks') || d.includes('clicks');
        if (dealRetailer === 'dischem') return m.includes('dis-chem') || d.includes('dischem');
        if (dealRetailer === 'leroy') return m.includes('leroy') || d.includes('leroy');
        if (dealRetailer === 'solar') return m.includes('solar') || m.includes('inverter') || d.includes('solar');
        return true;
      });
    }

    if (dealCategory !== 'all') {
      list = list.filter((s) => (s.category || '').toLowerCase() === dealCategory.toLowerCase());
    }

    if (dealSearch.trim()) {
      const q = dealSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.brand && s.brand.toLowerCase().includes(q)) ||
          s.merchant.toLowerCase().includes(q)
      );
    }

    return list.slice().sort((a, b) => {
      if (dealSort === 'price_asc') return (a.priceZar || 0) - (b.priceZar || 0);
      if (dealSort === 'price_desc') return (b.priceZar || 0) - (a.priceZar || 0);
      return (b.dropPct || 0) - (a.dropPct || 0);
    });
  }, [specials, dealRetailer, dealCategory, dealSearch, dealSort]);

  // Filter products catalog
  const filteredProducts = useMemo(() => {
    let list = allProducts;

    if (prodCategory !== 'all') {
      list = list.filter((p) => p.categoryRef === prodCategory);
    }

    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.specs.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    // Sort
    return list.slice().sort((a, b) => {
      if (prodSort === 'price_asc') return a.price - b.price;
      if (prodSort === 'price_desc') return b.price - a.price;
      if (prodSort === 'sellers') return b.sellerCount - a.sellerCount;
      // Default 'drop'
      return (b.dropPct || 0) - (a.dropPct || 0);
    });
  }, [allProducts, prodCategory, prodSearch, prodSort]);

  // Filter markets & groups
  const filteredMarkets = useMemo(() => {
    let list = allMarkets;

    if (marketProvince !== 'all') {
      list = list.filter((m) => m.province.toLowerCase() === marketProvince.toLowerCase());
    }

    if (marketSubFilter === 'fav') {
      list = list.filter((m) => favMarkets[m.id]);
    } else if (marketSubFilter === 'wholesale') {
      list = list.filter((m) => m.type === 'wholesale_plaza');
    } else if (marketSubFilter === 'malls') {
      list = list.filter((m) => m.type === 'mega_mall');
    } else if (marketSubFilter === 'transit') {
      list = list.filter((m) => m.type === 'transport_hub');
    }

    if (marketSearch.trim()) {
      const q = marketSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q) ||
          m.province.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q),
      );
    }

    return list;
  }, [allMarkets, marketSubFilter, marketProvince, marketSearch, favMarkets]);

  // Filter shorts
  const filteredShorts = useMemo(() => {
    let list = shorts;

    if (shortsCategory !== 'all') {
      const catKey = shortsCategory.toLowerCase();
      list = list.filter((s) => {
        const full = `${s.category || ''} ${s.title} ${s.summary || ''}`.toLowerCase();
        if (catKey === 'solar') return full.includes('solar') || full.includes('inverter') || full.includes('battery');
        if (catKey === 'tech') return full.includes('redmi') || full.includes('phone') || full.includes('tech');
        if (catKey === 'markets') return full.includes('market') || full.includes('plaza') || full.includes('mall');
        if (catKey === 'auto') return full.includes('brake') || full.includes('auto') || full.includes('spares');
        if (catKey === 'fmcg') return full.includes('maize') || full.includes('fmcg') || full.includes('food');
        if (catKey === 'packaging') return full.includes('kraft') || full.includes('pack');
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.summary && s.summary.toLowerCase().includes(q)) ||
          (s.merchantName && s.merchantName.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [shorts, shortsCategory, search]);

  return (
    <>
      {/* ── TOPBAR TABS ────────────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-search">
          <form
            className="searchbox"
            onSubmit={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M10.25 4.25a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-8 6a8 8 0 1 1 14.9 4.45l4.42 4.42-1.42 1.42-4.42-4.42A8 8 0 0 1 2.25 10.25z" />
            </svg>
            <input
              type="search"
              placeholder="Search products, brands, malls, stores..."
              aria-label="Search Shoppage"
              value={search}
              onChange={(e) => {
                window.dispatchEvent(
                  new CustomEvent('shoppage-nav', { detail: { type: 'search', query: e.target.value } }),
                );
              }}
            />
          </form>
        </div>
        {view === 'bookmarks' ? (
          <div className="viewtitle on">
            <h2>Bookmarks</h2>
            <p>Saved deals, price drops, and video proofs</p>
          </div>
        ) : (
          <div className="tabs">
            {/* 1. For You */}
            <button
              type="button"
              className={`tab${tab === 'foryou' ? ' on' : ''}`}
              onClick={() => {
                setTab('foryou');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              For You
            </button>

            {/* 2. Products (Search & Filter) */}
            <button
              type="button"
              className={`tab${tab === 'products' ? ' on' : ''}`}
              onClick={() => {
                setTab('products');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Products
            </button>

            {/* 3. Deals */}
            <button
              type="button"
              className={`tab${tab === 'deals' ? ' on' : ''}`}
              onClick={() => {
                setTab('deals');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Deals
            </button>

            {/* 4. My Markets (Favoured / Followed Hubs & Groups) */}
            <button
              type="button"
              className={`tab${tab === 'markets' ? ' on' : ''}`}
              onClick={() => {
                setTab('markets');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              My Markets
            </button>

            {/* 5. Shorts */}
            <button
              type="button"
              className={`tab${tab === 'shorts' ? ' on' : ''}`}
              onClick={() => {
                setTab('shorts');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Shorts
            </button>
          </div>
        )}
      </div>

      {/* ── COMPOSER (Home view & For You only) ────────────────────────────── */}
      {view === 'home' && tab === 'foryou' && (
        <div className="composer">
          <div className="avatar g8">Y</div>
          <div className="cbody">
            {replyTo && (
              <div className="replyto on">
                <span>Replying to {replyTo}</span>
                <button type="button" onClick={() => setReplyTo(null)}>
                  ✕ Cancel
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="What's happening in trade?!"
              value={composerText}
              onChange={handleComposerInput}
            />
            {isPollOpen && (
              <div className="poll-builder-box">
                <div className="poll-builder-head">
                  <span>📊 Trade Poll Setup</span>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '12px' }}
                    onClick={() => setIsPollOpen(false)}
                  >
                    ✕ Remove
                  </button>
                </div>
                <div className="poll-builder-inputs">
                  <input
                    type="text"
                    placeholder="Option 1 (e.g. 5kW Hybrid)"
                    value={pollOpt1}
                    onChange={(e) => setPollOpt1(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Option 2 (e.g. 8kW Hybrid)"
                    value={pollOpt2}
                    onChange={(e) => setPollOpt2(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Option 3 (optional, e.g. 10kW 3-Phase)"
                    value={pollOpt3}
                    onChange={(e) => setPollOpt3(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="ctools">
              <button
                type="button"
                className="tool"
                title="Media"
                onClick={() => toast('Attach media proof coming soon')}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13zM5.5 5c-.28 0-.5.22-.5.5v9.58l4.65-4.65a1 1 0 0 1 1.4 0L15 14.35l2.15-2.15a1 1 0 0 1 1.4 0L20 13.6V5.5c0-.28-.22-.5-.5-.5h-14zM19 16.44l-2.55-2.55-2.15 2.15a1 1 0 0 1-1.4 0L9 12.14l-4 4v2.36c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5v-2.06zM8.75 7a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5z" />
                </svg>
              </button>
              <button
                type="button"
                className={`tool${isPollOpen ? ' on' : ''}`}
                title="Poll"
                onClick={() => setIsPollOpen(!isPollOpen)}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21v-5.5h2V21H4z" />
                </svg>
              </button>
              <button
                type="button"
                className="tool"
                title="Emoji"
                onClick={() => toast('Emoji picker coming soon')}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM8.5 8A1.5 1.5 0 1 0 10 9.5 1.5 1.5 0 0 0 8.5 8zm7 0A1.5 1.5 0 1 0 17 9.5 1.5 1.5 0 0 0 15.5 8zM12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </button>
              <button
                type="button"
                className="tool"
                title="Location"
                onClick={() => toast('Trade counter geotag coming soon')}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z" />
                </svg>
              </button>

              <div className="cright">
                <div className={`ring${charLen > 0 ? ' on' : ''}`}>
                  <svg width="26" height="26">
                    <circle className="bgc" cx="13" cy="13" r="10" />
                    <circle
                      className="fgc"
                      cx="13"
                      cy="13"
                      r="10"
                      strokeDasharray="62.83"
                      strokeDashoffset={ringOffset}
                      stroke={ringColor}
                    />
                  </svg>
                  <span className="num" style={{ color: isOver ? 'var(--red)' : 'var(--text2)' }}>
                    {isOver ? charLen - 280 : isNear ? 280 - charLen : ''}
                  </span>
                </div>

                <button
                  type="button"
                  className="postb"
                  disabled={!composerText.trim() || isOver}
                  onClick={handlePostSubmit}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTS TAB: SEARCH & FILTER + CATALOG ───────────────────────── */}
      {view === 'home' && tab === 'products' && (
        <div className="products-view">
          <div className="stream-header">
            <h2>Products &amp; Trade Catalog</h2>
          </div>

          <div className="stream-tools">
            {/* Search input */}
            <div className="stream-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Search 1,000,000+ products (e.g. Deye 5kW, Cement, Hangers, Phones)..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
              />
              {prodSearch && (
                <button
                  type="button"
                  onClick={() => setProdSearch('')}
                  style={{ color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category filter pills */}
            <div className="chips-scroll">
              {PRODUCT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip-pill${prodCategory === c.id ? ' active' : ''}`}
                  onClick={() => setProdCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Sub-row: count, view mode toggle, and sort */}
            <div className="stream-subrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                Showing <b>{Math.min(visibleProductsCount, filteredProducts.length).toLocaleString()}</b> of <b>{filteredProducts.length.toLocaleString()}</b> verified products
                <span style={{ color: 'var(--text2)', marginLeft: '6px', fontSize: '12px' }}>
                  (1,000,000+ catalog in database)
                </span>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* View Mode Toggle: Grid vs List */}
                <div style={{ display: 'flex', background: 'var(--hover)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setProdViewMode('grid')}
                    title="Grid View"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: prodViewMode === 'grid' ? 700 : 500,
                      background: prodViewMode === 'grid' ? 'var(--card)' : 'transparent',
                      color: prodViewMode === 'grid' ? 'var(--text)' : 'var(--text2)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: prodViewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>⊞</span> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdViewMode('list')}
                    title="List View"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: prodViewMode === 'list' ? 700 : 500,
                      background: prodViewMode === 'list' ? 'var(--card)' : 'transparent',
                      color: prodViewMode === 'list' ? 'var(--text)' : 'var(--text2)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: prodViewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>☰</span> List
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Sort:</span>
                  <select
                    value={prodSort}
                    onChange={(e) => setProdSort(e.target.value as any)}
                    style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}
                  >
                    <option value="drop">Biggest Price Drop</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="sellers">Most Verified Stockists</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Presentation: Grid or List */}
          {prodViewMode === 'grid' ? (
            <div className="deals-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.slice(0, visibleProductsCount).map((p) => {
                  const saveZar = p.oldPrice && p.price && p.oldPrice > p.price
                    ? p.oldPrice - p.price
                    : null;
                  return (
                    <div key={p.id} className="deal-grid-card">
                      <div className="deal-card-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt={p.title} loading="lazy" />
                        <span className="deal-badge-retailer">{p.brand}</span>
                        {p.dropPct ? <span className="deal-badge-drop">-{p.dropPct}%</span> : null}
                      </div>

                      <div className="deal-card-body">
                        <div className="deal-card-cat">
                          {p.category}
                        </div>
                        <h3 className="deal-card-title">
                          <Link href={p.href} title={p.title}>
                            {p.title}
                          </Link>
                        </h3>

                        <div className="deal-card-prices">
                          <span className="deal-card-price">{formatZar(p.price)}</span>
                          {p.oldPrice ? (
                            <span className="deal-card-old">{formatZar(p.oldPrice)}</span>
                          ) : null}
                          {saveZar ? (
                            <span className="deal-card-save">Save {formatZar(saveZar)}</span>
                          ) : null}
                        </div>

                        <div className="deal-card-location">
                          🏢 {p.sellerCount} verified stockists · {p.stockistLocation}
                        </div>
                      </div>

                      <div className="deal-card-footer">
                        <Link href={p.href} className="deal-btn-direct">
                          View Stockists ↗
                        </Link>
                        <a
                          href={`https://wa.me/27820000000?text=${encodeURIComponent(
                            `Hi Shoppage, I'm looking for verified stockists for: ${p.title} (${formatZar(p.price)})`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="deal-btn-contact"
                          title="WhatsApp Stockist Inquiry"
                        >
                          💬 Contact
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty" style={{ gridColumn: '1 / -1' }}>
                  <h3>No products matched your criteria</h3>
                  <p>Try clearing search keywords or selecting All Categories.</p>
                </div>
              )}
            </div>
          ) : (
            /* Products List */
            <div className="products-list">
              {filteredProducts.length > 0 ? (
                filteredProducts.slice(0, visibleProductsCount).map((p) => {
                  const saveZar = p.oldPrice && p.price && p.oldPrice > p.price
                    ? p.oldPrice - p.price
                    : null;
                  return (
                    <div key={p.id} className="prod-card">
                      <div className="prod-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt={p.title} loading="lazy" />
                      </div>
                      <div className="prod-content">
                        <div>
                          <div className="prod-head">
                            <h3>
                              <Link href={p.href}>{p.title}</Link>
                            </h3>
                            {p.dropPct && <span className="prod-drop">-{p.dropPct}%</span>}
                          </div>
                          <p className="prod-specs">{p.specs}</p>
                          <p className="prod-location">
                            🏢 {p.sellerCount} verified stockists · {p.stockistLocation}
                          </p>
                        </div>

                        <div>
                          <div className="prod-price-row">
                            <span className="prod-price">{formatZar(p.price)}</span>
                            {p.oldPrice && (
                              <span className="prod-old">{formatZar(p.oldPrice)}</span>
                            )}
                            {saveZar ? (
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>
                                Save {formatZar(saveZar)}
                              </span>
                            ) : null}
                          </div>

                          <div className="prod-actions">
                            <Link href={p.href} className="btn-stockists">
                              View Stockists ↗
                            </Link>
                            <a
                              href={`https://wa.me/27820000000?text=${encodeURIComponent(
                                `Hi Shoppage, I'm looking for verified stockists for: ${p.title} (${formatZar(p.price)})`,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-contact"
                              title="WhatsApp Stockist Inquiry"
                            >
                              💬 Contact
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <h3>No products matched your criteria</h3>
                  <p>Try clearing search keywords or selecting All Categories.</p>
                </div>
              )}
            </div>
          )}

          {/* Load More Products Button */}
          {visibleProductsCount < filteredProducts.length && (
            <div style={{ textAlign: 'center', padding: '24px 0 36px', width: '100%' }}>
              <button
                type="button"
                className="btn-stockists"
                onClick={() => setVisibleProductsCount((c) => c + 48)}
                style={{
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'var(--brand)',
                  color: '#000',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Load More Products ({filteredProducts.length - visibleProductsCount} remaining) ↓
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MY MARKETS TAB: HUBS, WHOLESALE PLAZAS & CONTRACTOR GROUPS ───── */}
      {view === 'home' && tab === 'markets' && (
        <div className="markets-view">
          <div className="stream-header">
            <h2>My Markets &amp; Trade Hubs</h2>
            <p>
              Follow and favourite wholesale malls, regional trade plazas, and contractor networks across South Africa.
            </p>
          </div>

          {/* Quick Stats Strip */}
          <div className="market-stats-banner">
            <div className="market-stat-card">
              <span className="val">{allMarkets.length}</span>
              <span className="lbl">Verified Hubs</span>
            </div>
            <div className="market-stat-card">
              <span className="val">{allMarkets.filter((m) => m.type === 'wholesale_plaza').length}</span>
              <span className="lbl">Wholesale Plazas</span>
            </div>
            <div className="market-stat-card">
              <span className="val">1,500+</span>
              <span className="lbl">Active Counters</span>
            </div>
            <div className="market-stat-card">
              <span className="val">9 Provinces</span>
              <span className="lbl">Nationwide Map</span>
            </div>
          </div>

          <div className="stream-tools">
            {/* Search in markets */}
            <div className="stream-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Search markets or groups (e.g. Dragon City, Oriental Plaza, Sandton)..."
                value={marketSearch}
                onChange={(e) => setMarketSearch(e.target.value)}
              />
              {marketSearch && (
                <button
                  type="button"
                  onClick={() => setMarketSearch('')}
                  style={{ color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Province filter pills */}
            <div className="chips-scroll">
              {SA_PROVINCES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`chip-pill${marketProvince === p.id ? ' active' : ''}`}
                  onClick={() => setMarketProvince(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Market type filter pills */}
            <div className="chips-scroll" style={{ marginTop: '6px' }}>
              <button
                type="button"
                className={`chip-pill${marketSubFilter === 'all' ? ' active' : ''}`}
                onClick={() => setMarketSubFilter('all')}
              >
                All Formats ({allMarkets.length})
              </button>
              <button
                type="button"
                className={`chip-pill${marketSubFilter === 'fav' ? ' active' : ''}`}
                onClick={() => setMarketSubFilter('fav')}
              >
                ⭐ Favoured ({Object.values(favMarkets).filter(Boolean).length})
              </button>
              <button
                type="button"
                className={`chip-pill${marketSubFilter === 'wholesale' ? ' active' : ''}`}
                onClick={() => setMarketSubFilter('wholesale')}
              >
                🏢 Wholesale Plazas
              </button>
              <button
                type="button"
                className={`chip-pill${marketSubFilter === 'malls' ? ' active' : ''}`}
                onClick={() => setMarketSubFilter('malls')}
              >
                🏬 Commercial Malls
              </button>
              <button
                type="button"
                className={`chip-pill${marketSubFilter === 'transit' ? ' active' : ''}`}
                onClick={() => setMarketSubFilter('transit')}
              >
                🚌 Transit Ranks
              </button>
            </div>

            {/* Sub-row: count and Grid/List toggle */}
            <div
              className="stream-subrow"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                Showing <b>{filteredMarkets.length}</b> verified trade hubs
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`chip-pill${marketViewMode === 'grid' ? ' active' : ''}`}
                  onClick={() => setMarketViewMode('grid')}
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  ▦ Grid
                </button>
                <button
                  type="button"
                  className={`chip-pill${marketViewMode === 'list' ? ' active' : ''}`}
                  onClick={() => setMarketViewMode('list')}
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  ☰ List
                </button>
              </div>
            </div>
          </div>

          {/* Markets Display: Grid vs List */}
          {marketViewMode === 'grid' ? (
            <div className="markets-grid">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((m) => {
                  const isFav = !!favMarkets[m.id];
                  const isFollowed = !!followedMarkets[m.id];
                  return (
                    <div key={m.id} className="market-grid-card">
                      <div>
                        <div className="market-card-top">
                          <div className={`avatar ${m.avatarClass}`} style={{ width: '48px', height: '48px', fontSize: '16px' }}>
                            {m.initials}
                          </div>
                          <div className="market-card-info">
                            <h3 className="market-card-name" title={m.name}>
                              <button
                                type="button"
                                onClick={() => setSelectedMarketDetail(m)}
                                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left', fontWeight: 800 }}
                              >
                                {m.name}
                              </button>
                            </h3>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '2px' }}>
                              <span className="chip" style={{ fontSize: '11px', padding: '2px 6px' }}>{m.typeLabel}</span>
                              <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{m.province}</span>
                            </div>
                          </div>
                        </div>

                        <p className="market-card-desc">{m.description}</p>

                        <div className="market-card-meta-row">
                          <span>📍 {m.location.split(',')[0]}</span>
                          {m.stalls ? <span>· <b>{m.stalls}+ Stalls</b></span> : null}
                          {m.operatingHours ? <span>· ⏰ {m.operatingHours.split('|')[0].trim()}</span> : null}
                        </div>
                      </div>

                      <div className="market-card-actions">
                        <button
                          type="button"
                          className="btn-card-quick"
                          onClick={() => setSelectedMarketDetail(m)}
                        >
                          Quick View
                        </button>
                        <button
                          type="button"
                          className={`fav-btn${isFav ? ' active' : ''}`}
                          onClick={() => toggleFavMarket(m.id, m.name)}
                          title={isFav ? 'Remove favourite' : 'Add to favourites'}
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          {isFav ? '★' : '☆'}
                        </button>
                        <button
                          type="button"
                          className={`follow-btn${isFollowed ? ' active' : ''}`}
                          onClick={() => toggleFollowMarket(m.id, m.name)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {isFollowed ? 'Following' : 'Follow'}
                        </button>
                        <Link
                          href={m.href}
                          className="visit-btn"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Stalls 🏢
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty" style={{ gridColumn: '1 / -1' }}>
                  <h3>No markets match this filter</h3>
                  <p>Try switching to &quot;All Formats&quot; or clearing your province selection.</p>
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="markets-list">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((m) => {
                  const isFav = !!favMarkets[m.id];
                  const isFollowed = !!followedMarkets[m.id];
                  return (
                    <div key={m.id} className="market-card">
                      <div className={`avatar ${m.avatarClass}`}>{m.initials}</div>
                      <div className="market-content">
                        <div className="market-header">
                          <div>
                            <h3 className="market-title">
                              <button
                                type="button"
                                onClick={() => setSelectedMarketDetail(m)}
                                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                              >
                                {m.name}
                              </button>
                            </h3>
                            <p className="market-meta">
                              {m.handle} · <span className="chip">{m.typeLabel}</span> · <span>📍 {m.province}</span>
                            </p>
                          </div>
                        </div>

                        <p className="market-desc">{m.description}</p>

                        <p className="market-meta" style={{ marginTop: '6px' }}>
                          📍 {m.location}
                          {m.stalls ? (
                            <>
                              {' '}· <b>{m.stalls}+ Active Stalls</b>
                            </>
                          ) : null}
                          {m.operatingHours ? (
                            <>
                              {' '}· ⏰ {m.operatingHours.split('|')[0].trim()}
                            </>
                          ) : null}
                        </p>

                        <div className="market-actions">
                          <button
                            type="button"
                            className="btn-card-quick"
                            onClick={() => setSelectedMarketDetail(m)}
                            style={{ flex: 'none', padding: '6px 14px' }}
                          >
                            Quick View
                          </button>

                          <button
                            type="button"
                            className={`fav-btn${isFav ? ' active' : ''}`}
                            onClick={() => toggleFavMarket(m.id, m.name)}
                            title={isFav ? 'Remove favourite' : 'Add to favourites'}
                          >
                            {isFav ? '★ Favoured' : '⭐ Favourite'}
                          </button>

                          <button
                            type="button"
                            className={`follow-btn${isFollowed ? ' active' : ''}`}
                            onClick={() => toggleFollowMarket(m.id, m.name)}
                          >
                            {isFollowed ? 'Following' : 'Follow'}
                          </button>

                          <Link href={m.href} className="visit-btn">
                            Browse Stalls 🏢
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <h3>No markets match this filter</h3>
                  <p>Try switching to &quot;All Hubs&quot; or clearing your search term.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DEALS TAB: MAJOR RETAILER CIRCULARS & DISCOVERED SPECIALS (GUZZLE-STYLE) ── */}
      {view === 'home' && tab === 'deals' && (
        <div className="products-view">
          <div className="stream-header">
            <h2>🔥 South Africa Retailer Specials &amp; Circulars</h2>
          </div>

          <div className="stream-tools">
            {/* Search within Deals */}
            <div className="stream-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Search specials across BUCO, Game, Builders, SPAR, Makro..."
                value={dealSearch}
                onChange={(e) => setDealSearch(e.target.value)}
              />
              {dealSearch && (
                <button
                  type="button"
                  onClick={() => setDealSearch('')}
                  style={{ color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Retailer filter pills */}
            <div className="chips-scroll">
              {DEAL_RETAILERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`chip-pill${dealRetailer === r.id ? ' active' : ''}`}
                  onClick={() => setDealRetailer(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Category filter pills */}
            <div className="chips-scroll" style={{ marginTop: '6px' }}>
              {DEAL_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip-pill${dealCategory === c.id ? ' active' : ''}`}
                  onClick={() => setDealCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Sub-row: count, view mode toggle, and sort */}
            <div className="stream-subrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  Showing {Math.min(visibleDealsCount, filteredSpecials.length).toLocaleString()} of {filteredSpecials.length.toLocaleString()} verified deals
                </span>
                {dealRetailer !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setDealRetailer('all')}
                    style={{ fontSize: '11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', padding: '2px 8px', color: 'var(--brand)', cursor: 'pointer' }}
                  >
                    Reset retailer ✕
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* View Mode Toggle: Grid vs List */}
                <div style={{ display: 'flex', background: 'var(--hover)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setDealViewMode('grid')}
                    title="Grid View"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: dealViewMode === 'grid' ? 700 : 500,
                      background: dealViewMode === 'grid' ? 'var(--card)' : 'transparent',
                      color: dealViewMode === 'grid' ? 'var(--text)' : 'var(--text2)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: dealViewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>⊞</span> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setDealViewMode('list')}
                    title="List View"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: dealViewMode === 'list' ? 700 : 500,
                      background: dealViewMode === 'list' ? 'var(--card)' : 'transparent',
                      color: dealViewMode === 'list' ? 'var(--text)' : 'var(--text2)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: dealViewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>☰</span> List
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Sort:</span>
                  <select
                    value={dealSort}
                    onChange={(e) => setDealSort(e.target.value as any)}
                    style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}
                  >
                    <option value="discount">Biggest Price Drop (%)</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Deals Presentation: Grid or List */}
          {dealViewMode === 'grid' ? (
            <div className="deals-grid">
              {filteredSpecials.length > 0 ? (
                filteredSpecials.slice(0, visibleDealsCount).map((s) => {
                  const saveZar = s.oldPriceZar && s.priceZar && s.oldPriceZar > s.priceZar
                    ? s.oldPriceZar - s.priceZar
                    : null;
                  return (
                    <div key={s.id} className="deal-grid-card">
                      <div className="deal-card-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.image} alt={s.title} loading="lazy" />
                        <span className="deal-badge-retailer">{s.merchant.split(' ')[0]}</span>
                        {s.dropPct ? <span className="deal-badge-drop">-{s.dropPct}%</span> : null}
                      </div>

                      <div className="deal-card-body">
                        <div className="deal-card-cat">
                          {s.merchant} · {s.categoryLabel}
                        </div>
                        <h3 className="deal-card-title">
                          <a href={s.url} target="_blank" rel="noopener noreferrer" title={s.title}>
                            {s.title}
                          </a>
                        </h3>

                        <div className="deal-card-prices">
                          <span className="deal-card-price">{s.priceText}</span>
                          {s.oldPriceZar ? (
                            <span className="deal-card-old">{formatZar(s.oldPriceZar)}</span>
                          ) : null}
                          {saveZar ? (
                            <span className="deal-card-save">Save {formatZar(saveZar)}</span>
                          ) : null}
                        </div>

                        <div className="deal-card-location">
                          🏢 {s.availability || 'In Stock'} · {s.locationHint || 'National Retailer'}
                        </div>
                      </div>

                      <div className="deal-card-footer">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="deal-btn-direct"
                        >
                          Buy on {s.merchant.split(' ')[0]} ↗
                        </a>
                        <a
                          href={`https://wa.me/27820000000?text=${encodeURIComponent(
                            `Hi Shoppage, I'm interested in this retailer deal: ${s.title} (${s.priceText}) at ${s.merchant}`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="deal-btn-contact"
                          title="WhatsApp Retailer Deal Inquiry"
                        >
                          💬 Contact
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty" style={{ gridColumn: '1 / -1' }}>
                  <h3>No retailer deals match this filter</h3>
                  <p>Try switching to &quot;All Major Retailers&quot; or clearing your search term.</p>
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="products-list">
              {filteredSpecials.length > 0 ? (
                filteredSpecials.slice(0, visibleDealsCount).map((s) => {
                  const saveZar = s.oldPriceZar && s.priceZar && s.oldPriceZar > s.priceZar
                    ? s.oldPriceZar - s.priceZar
                    : null;
                  return (
                    <div key={s.id} className="prod-card">
                      <div className="prod-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.image} alt={s.title} loading="lazy" />
                      </div>
                      <div className="prod-content">
                        <div>
                          <div className="prod-head">
                            <h3>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'none' }}
                              >
                                {s.title}
                              </a>
                            </h3>
                            {s.dropPct ? <span className="prod-drop">-{s.dropPct}%</span> : null}
                          </div>
                          <p className="prod-specs">
                            🏷️ <b>{s.merchant}</b> · {s.categoryLabel}
                            {s.badge ? <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{s.badge}</span> : null}
                          </p>
                          <p className="prod-location">
                            🏢 {s.availability || 'In Stock'} · {s.locationHint || 'National Retailer'}
                          </p>
                        </div>

                        <div>
                          <div className="prod-price-row">
                            <span className="prod-price">{s.priceText}</span>
                            {s.oldPriceZar ? (
                              <span className="prod-old">{formatZar(s.oldPriceZar)}</span>
                            ) : null}
                            {saveZar ? (
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>
                                Save {formatZar(saveZar)}
                              </span>
                            ) : null}
                          </div>

                          <div className="prod-actions">
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-stockists"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                background: '#0EA5E9',
                                color: '#FFFFFF',
                                fontWeight: 600,
                              }}
                            >
                              View on {s.merchant.split(' ')[0]} ↗
                            </a>
                            <a
                              href={`https://wa.me/27820000000?text=${encodeURIComponent(
                                `Hi Shoppage, I'm interested in this retailer deal: ${s.title} (${s.priceText}) at ${s.merchant}`,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-contact"
                              title="WhatsApp Retailer Deal Inquiry"
                            >
                              💬 Contact
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <h3>No retailer deals match this filter</h3>
                  <p>Try switching to &quot;All Major Retailers&quot; or clearing your search term.</p>
                </div>
              )}
            </div>
          )}

          {visibleDealsCount < filteredSpecials.length && (
            <div style={{ textAlign: 'center', padding: '24px 0 36px', width: '100%' }}>
              <button
                type="button"
                className="btn-stockists"
                onClick={() => setVisibleDealsCount((c) => c + 48)}
                style={{
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'var(--brand)',
                  color: '#000',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Load More Verified Deals ({filteredSpecials.length - visibleDealsCount} remaining) ↓
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TIMELINE POSTS & SHORTS (For You, Bookmarks, Shorts) ───── */}
      {(view === 'bookmarks' || tab === 'foryou' || tab === 'shorts') && (
        <>
        <div id="feed">
          {tab === 'shorts' && view === 'home' ? (
            <div className="shorts-view" style={{ padding: '0 16px 40px' }}>
              <div className="stream-header" style={{ padding: '16px 0 8px' }}>
                <h2>🎬 Live Commercial Shorts &amp; Reels</h2>
                <p>
                  Watch verified South African trade tests, pallet unboxings, inverter inspections, and factory bulk drops.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="chips-scroll" style={{ marginBottom: '14px' }}>
                {SHORTS_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip-pill${shortsCategory === c.id ? ' active' : ''}`}
                    onClick={() => setShortsCategory(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {filteredShorts.length > 0 ? (
                <div className="shorts-tab-grid">
                  {filteredShorts.map((s) => {
                    const featured = s.featuredProducts?.[0];
                    return (
                      <div
                        key={s.id}
                        className="short-reel-card"
                        style={{ backgroundImage: `url('${s.img}')` }}
                        onClick={() => setSelectedShortModal(s)}
                      >
                        {/* Top Badges */}
                        <div className="short-card-top">
                          {s.category ? (
                            <span className="short-cat-pill">{s.category}</span>
                          ) : <span />}
                          {s.dur ? (
                            <span className="short-dur-pill">{s.dur}</span>
                          ) : null}
                        </div>

                        {/* Central Play Overlay */}
                        <div className="short-play-center">
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>

                        {/* Bottom Metadata */}
                        <div className="short-card-bottom">
                          <div className="short-views-pill">
                            🔥 {s.likes ? `${(s.likes / 100).toFixed(1)}k views` : '1.2k views'}
                          </div>
                          <h4 className="short-card-title">{s.title}</h4>
                          <div className="short-card-merchant">
                            <span>{s.merchantName || 'Verified Merchant'}</span>
                            <span style={{ color: '#38BDF8', fontSize: '10px' }}>✓</span>
                          </div>
                          {featured && (
                            <div className="short-product-pill">
                              🏷️ {featured.title.split(' ')[0]} · R{featured.price.toLocaleString('en-ZA')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <h3>No Commercial Shorts Found</h3>
                  <p>Try switching to &quot;All Trade Reels&quot; or clearing your search term.</p>
                </div>
              )}
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                isLiked={liked[post.id]}
                isReposted={reposted[post.id]}
                isBookmarked={bookmarked[post.id]}
                onLike={handleLike}
                onRepost={handleRepost}
                onBookmark={handleBookmark}
                onReply={handleReply}
                onGetDeal={handleGetDeal}
                onOpenDetail={(p) => setSelectedPostDetail(p)}
              />
            ))
          ) : (
            <div className="empty">
              {view === 'bookmarks' ? (
                <>
                  <h3>Save deals for later</h3>
                  <p>Tap the bookmark icon on any post and it will land here.</p>
                </>
              ) : search.trim() ? (
                <>
                  <h3>Nothing here yet</h3>
                  <p>
                    No posts match &quot;{search}&quot; in this stream. Try the For You timeline.
                  </p>
                </>
              ) : (
                <>
                  <h3>No live deals right now</h3>
                  <p>New offers land here as trade counters confirm stock.</p>
                </>
              )}
            </div>
          )}
        </div>
        </>
      )}

      {/* ── MODALS (Post Detail, Market Detail, Shorts Reels) ───────────────── */}
      {selectedPostDetail && (
        <PostDetailModal
          post={selectedPostDetail}
          onClose={() => setSelectedPostDetail(null)}
          isLiked={!!liked[selectedPostDetail.id]}
          isReposted={!!reposted[selectedPostDetail.id]}
          isBookmarked={!!bookmarked[selectedPostDetail.id]}
          onLike={handleLike}
          onRepost={handleRepost}
          onBookmark={handleBookmark}
        />
      )}

      {selectedMarketDetail && (
        <MarketDetailModal
          market={selectedMarketDetail}
          onClose={() => setSelectedMarketDetail(null)}
          isFav={!!favMarkets[selectedMarketDetail.id]}
          isFollowed={!!followedMarkets[selectedMarketDetail.id]}
          onToggleFav={toggleFavMarket}
          onToggleFollow={toggleFollowMarket}
        />
      )}

      {selectedShortModal && (
        <ShortsViewerModal
          short={selectedShortModal}
          shortsList={filteredShorts}
          onClose={() => setSelectedShortModal(null)}
          onSelectShort={setSelectedShortModal}
        />
      )}

      {/* ── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      <div className={`toast${toastOn ? ' on' : ''}`}>{toastMsg}</div>
    </>
  );
}
