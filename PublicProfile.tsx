import { useState, useEffect, FormEvent } from 'react';
import { 
  Twitter, Instagram, Youtube, Github, Linkedin, ExternalLink, 
  ShoppingBag, Sparkles, AlertCircle, CheckCircle2, DollarSign, 
  ArrowLeft, Download, ShieldCheck, Heart
} from 'lucide-react';
import { Profile, LinkItem, Product } from '../types';
import { supabase, localDb, isSupabaseConfigured } from '../lib/supabase';

interface PublicProfileProps {
  username: string;
  onNavigate: (view: string) => void;
  viewerSession?: { id: string; email: string } | null;
}

export default function PublicProfile({ username, onNavigate, viewerSession }: PublicProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Followers State
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Checkout Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // SEO Optimization: Inject custom meta, OpenGraph, and JSON-LD schema
  useEffect(() => {
    if (!profile) return;
    
    // 1. Title
    const originalTitle = document.title;
    document.title = `${profile.full_name} (@${profile.username}) | Nuvix Link-in-Bio`;

    // 2. Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const originalDesc = metaDesc.getAttribute('content') || '';
    metaDesc.setAttribute('content', `${profile.full_name}'s official links, store, and updates on Nuvix. ${profile.bio}`);

    // 3. OpenGraph Tags
    const ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', `${profile.full_name} on Nuvix`);
    document.head.appendChild(ogTitle);

    const ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    ogImage.setAttribute('content', profile.avatar_url);
    document.head.appendChild(ogImage);

    // 4. Schema.org JSON-LD structured metadata
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'creator-seo-schema';
    schemaScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "mainEntity": {
        "@type": "Person",
        "name": profile.full_name,
        "alternateName": profile.username,
        "description": profile.bio,
        "image": profile.avatar_url,
        "sameAs": Object.values(profile.social_links || {}).filter(Boolean)
      }
    });
    document.head.appendChild(schemaScript);

    return () => {
      document.title = originalTitle;
      if (metaDesc) metaDesc.setAttribute('content', originalDesc);
      document.getElementById('creator-seo-schema')?.remove();
      ogTitle.remove();
      ogImage.remove();
    };
  }, [profile]);

  useEffect(() => {
    async function fetchCreatorData() {
      setLoading(true);
      try {
        let dbProfile: Profile | null = null;
        let dbLinks: LinkItem[] = [];
        let dbProducts: Product[] = [];

        if (isSupabaseConfigured && supabase) {
          // Real Supabase data load
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username.toLowerCase())
            .single();

          if (profileData) {
            dbProfile = profileData;
            
            const { data: linksData } = await supabase
              .from('links')
              .select('*')
              .eq('user_id', profileData.id)
              .eq('is_active', true);
            if (linksData) dbLinks = linksData;

            const { data: productsData } = await supabase
              .from('products')
              .select('*')
              .eq('user_id', profileData.id)
              .eq('is_active', true);
            if (productsData) dbProducts = productsData;
          }
        } else {
          // Offline mock database load
          dbProfile = await localDb.getProfileByUsername(username);
          if (dbProfile) {
            dbLinks = await localDb.getLinks(dbProfile.id);
            dbProducts = await localDb.getProducts(dbProfile.id);
          }
        }

        if (dbProfile) {
          // Handle custom generated AI themes
          if (dbProfile.theme && dbProfile.theme.startsWith('{')) {
            try {
              dbProfile.custom_theme = JSON.parse(dbProfile.theme);
            } catch (err) {
              console.warn('Failed parsing theme JSON string', err);
            }
          }
          
          setProfile(dbProfile);
          setLinks(dbLinks);
          setProducts(dbProducts);

          // Get Followers Count
          const fCount = await localDb.getFollowersCount(dbProfile.id);
          setFollowersCount(fCount);

          if (viewerSession) {
            const activeFollowing = await localDb.isFollowing(viewerSession.id, dbProfile.id);
            setIsFollowing(activeFollowing);
          }

          // Increment views asynchronously
          if (isSupabaseConfigured && supabase) {
            // Can increment view in Supabase if implemented, or ignore for mock preview
          } else {
            await localDb.incrementProfileViews(dbProfile.id);
          }
        }
      } catch (err) {
        console.error('Error fetching creator profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCreatorData();
  }, [username, viewerSession]);

  const handleFollowToggle = async () => {
    if (!viewerSession || !profile) return;
    try {
      if (isFollowing) {
        await localDb.unfollowCreator(viewerSession.id, profile.id);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await localDb.followCreator(viewerSession.id, profile.id);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      if (isSupabaseConfigured && supabase) {
        // Increment in Supabase
        await supabase.rpc('increment_link_click', { link_id: linkId });
      } else {
        await localDb.incrementLinkClick(linkId);
      }
    } catch (err) {
      console.warn('Click count tracking skipped:', err);
    }
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleBuySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !profile) return;
    setPurchasing(true);

    try {
      // Simulate Stripe/payment gateway processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (isSupabaseConfigured && supabase) {
        // Log transaction or increment sale count in Supabase
        await supabase
          .from('products')
          .update({ sales_count: (selectedProduct.sales_count || 0) + 1 })
          .eq('id', selectedProduct.id);
      } else {
        await localDb.buyProduct(selectedProduct.id);
        
        // Push Notification to Creator
        await localDb.addNotification(profile.id, {
          user_id: profile.id,
          title: 'Digital Sale! 💰',
          content: `${checkoutName || 'An anonymous buyer'} bought "${selectedProduct.title}" for $${selectedProduct.price}!`,
          type: 'sale'
        });
      }

      setPurchaseSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background text-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading aesthetic profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center bg-background">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-black text-foreground">Creator Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          The handle <span className="font-mono text-indigo-500 font-semibold">@{username}</span> has not been claimed on Nuvix yet.
        </p>
        <button
          onClick={() => onNavigate('signup')}
          className="mt-6 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-600 transition-all"
        >
          Claim this username now
        </button>
      </div>
    );
  }

  // --- THEME CUSTOM COLOR RESOLVER ---
  let themeBg = 'bg-slate-50 dark:bg-slate-900 text-foreground';
  let cardClass = 'bg-white dark:bg-card border border-border text-foreground hover:bg-accent/40';
  let buttonClass = 'bg-indigo-500 hover:bg-indigo-600 text-white';
  let titleClass = 'text-foreground font-black';
  let usernameClass = 'text-indigo-500 font-bold';
  let ringClass = 'ring-2 ring-indigo-500/20';
  let textMutedClass = 'text-muted-foreground';

  if (profile.custom_theme) {
    const ct = profile.custom_theme;
    themeBg = ct.background;
    cardClass = ct.cardBg;
    buttonClass = ct.primaryBtn;
    titleClass = `${ct.accentColor} font-black`;
    usernameClass = `${ct.accentColor} font-bold opacity-90`;
    ringClass = `ring-4 ring-offset-2 ${ct.accentColor}`;
    textMutedClass = 'text-foreground/75';
  } else if (profile.theme === 'glassmorphism') {
    themeBg = 'bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 text-white min-h-screen';
    cardClass = 'bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/10 hover:border-white/20';
    buttonClass = 'bg-gradient-to-r from-pink-500 to-purple-500 text-white';
    titleClass = 'text-white font-extrabold';
    usernameClass = 'text-pink-400 font-semibold';
    ringClass = 'ring-2 ring-pink-500/30';
    textMutedClass = 'text-indigo-200/80';
  } else if (profile.theme === 'neo-brutalist') {
    themeBg = 'bg-amber-100 text-slate-950 min-h-screen';
    cardClass = 'bg-white hover:bg-slate-50 text-slate-950 border-4 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-200';
    buttonClass = 'bg-yellow-400 text-slate-950 font-bold border-2 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all';
    titleClass = 'text-slate-950 font-black tracking-tight';
    usernameClass = 'text-orange-600 font-extrabold underline';
    ringClass = 'border-4 border-slate-950';
    textMutedClass = 'text-slate-800';
  } else if (profile.theme === 'emerald-glow') {
    themeBg = 'bg-slate-950 text-white min-h-screen';
    cardClass = 'bg-emerald-950/20 hover:bg-emerald-950/35 border border-emerald-500/20 text-emerald-100 hover:border-emerald-500/40 shadow-lg shadow-emerald-500/5';
    buttonClass = 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold';
    titleClass = 'text-white font-extrabold';
    usernameClass = 'text-emerald-400 font-semibold';
    ringClass = 'ring-2 ring-emerald-500/40';
    textMutedClass = 'text-slate-400';
  } else if (profile.theme === 'sunset') {
    themeBg = 'bg-gradient-to-tr from-amber-500 to-pink-600 text-white min-h-screen';
    cardClass = 'bg-white/15 hover:bg-white/25 text-white backdrop-blur border border-white/10';
    buttonClass = 'bg-white text-pink-600 font-bold';
    titleClass = 'text-white font-black';
    usernameClass = 'text-amber-200 font-bold';
    ringClass = 'ring-4 ring-white/20';
    textMutedClass = 'text-amber-50/90';
  } else if (profile.theme === 'aurora') {
    themeBg = 'bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 text-white min-h-screen';
    cardClass = 'bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/20 text-cyan-200';
    buttonClass = 'bg-cyan-500 hover:bg-cyan-600 text-indigo-950 font-black';
    titleClass = 'text-white font-extrabold';
    usernameClass = 'text-cyan-400 font-bold';
    ringClass = 'ring-2 ring-cyan-500/30';
    textMutedClass = 'text-indigo-200/80';
  }

  return (
    <div className={`w-full min-h-[calc(100vh-4rem)] py-12 px-4 transition-all duration-500 ${themeBg}`}>
      
      {/* Bio page frame */}
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Creator Identity Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            referrerPolicy="no-referrer"
            className={`h-28 w-28 rounded-3xl object-cover shadow-xl ${ringClass}`}
          />
          <div className="space-y-1.5">
            <h1 className={`text-3xl font-black tracking-tight ${titleClass}`}>
              {profile.full_name}
            </h1>
            <p className={`text-sm tracking-wider uppercase ${usernameClass}`}>
              @{profile.username}
            </p>
          </div>
          <p className={`text-sm max-w-md leading-relaxed ${textMutedClass}`}>
            {profile.bio}
          </p>

          {/* Followers Counter & Follow Toggle */}
          <div className="flex items-center gap-3.5 mt-1 bg-black/10 dark:bg-white/10 px-4 py-1.5 rounded-2xl border border-current/10">
            <span className="text-xs font-semibold">
              <span className="font-extrabold text-sm text-indigo-500 mr-1">{followersCount}</span> 
              Followers
            </span>
            {viewerSession && viewerSession.id !== profile.id && (
              <button
                onClick={handleFollowToggle}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all duration-300 ${
                  isFollowing ? 'bg-black/25 hover:bg-black/35 text-current' : buttonClass
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Social Row */}
          <div className="flex gap-4 justify-center pt-2">
            {profile.social_links?.twitter && (
              <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100 transition-opacity">
                <Twitter className="h-5 w-5" />
              </a>
            )}
            {profile.social_links?.instagram && (
              <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100 transition-opacity">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {profile.social_links?.youtube && (
              <a href={profile.social_links.youtube} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100 transition-opacity">
                <Youtube className="h-5 w-5" />
              </a>
            )}
            {profile.social_links?.github && (
              <a href={profile.social_links.github} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100 transition-opacity">
                <Github className="h-5 w-5" />
              </a>
            )}
            {profile.social_links?.linkedin && (
              <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100 transition-opacity">
                <Linkedin className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        {/* --- LINKS-IN-BIO SECTION --- */}
        <div className="space-y-3">
          {links.length > 0 ? (
            links.map((lnk) => (
              <button
                key={lnk.id}
                onClick={() => handleLinkClick(lnk.id, lnk.url)}
                className={`w-full p-4.5 rounded-2xl text-center text-sm font-bold shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer ${cardClass}`}
              >
                <div className="w-5 h-5 shrink-0"></div> {/* Balanced spacing */}
                <span className="truncate pr-4">{lnk.title}</span>
                <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-all shrink-0" />
              </button>
            ))
          ) : (
            <p className="text-center text-xs opacity-60">No active links published.</p>
          )}
        </div>

        {/* --- DIGITAL PRODUCTS STORE --- */}
        {products.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-current/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-center opacity-80 flex items-center justify-center gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              Digital Store Showcase
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl overflow-hidden p-4 flex flex-col sm:flex-row items-center gap-4.5 shadow-md ${cardClass}`}
                >
                  <img
                    src={p.cover_url}
                    alt={p.title}
                    referrerPolicy="no-referrer"
                    className="h-24 w-24 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-grow min-w-0 text-center sm:text-left space-y-1">
                    <h4 className="font-bold text-base truncate">{p.title}</h4>
                    <p className={`text-xs line-clamp-2 leading-relaxed opacity-80`}>
                      {p.description || 'Digital template or download bundle.'}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <span className="text-sm font-black text-indigo-500">${p.price}</span>
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setPurchaseSuccess(false);
                        }}
                        className={`px-4.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm ${buttonClass}`}
                      >
                        Buy Now
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer brand */}
        <div className="flex flex-col items-center justify-center pt-16 gap-2">
          <div 
            onClick={() => onNavigate('landing')} 
            className="flex items-center gap-1.5 text-xs font-bold cursor-pointer opacity-70 hover:opacity-100 transition-opacity bg-current/5 px-3.5 py-1.5 rounded-full border border-current/10"
          >
            Powered by 
            <span className="font-black bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
              Nuvix
            </span>
          </div>
          <p className="text-[10px] opacity-40">Create your own link-in-bio & product store in 5 minutes</p>
        </div>

      </div>

      {/* --- SIMULATED PAYMENT DIALOG / BACKDROP --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 text-foreground shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-indigo-500 animate-pulse" />
                Secure Checkout
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg p-1 hover:bg-muted text-muted-foreground transition-all"
              >
                ✕
              </button>
            </div>

            {!purchaseSuccess ? (
              /* Checkout form */
              <form onSubmit={handleBuySubmit} className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-xl border border-border flex gap-3.5">
                  <img src={selectedProduct.cover_url} referrerPolicy="no-referrer" className="h-14 w-14 object-cover rounded-lg shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm line-clamp-1">{selectedProduct.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">${selectedProduct.price}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    placeholder="E.g., John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Email for Delivery</label>
                  <input
                    type="email"
                    required
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={purchasing}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-bold text-white shadow shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {purchasing ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        Pay ${selectedProduct.price} with Card
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success delivery page */
              <div className="text-center py-6 space-y-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 animate-bounce">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-foreground">Purchase Confirmed!</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Thank you for supporting <span className="font-bold text-indigo-500">@{profile.username}</span>. A receipt has been generated for {checkoutEmail}.
                  </p>
                </div>

                {/* Direct download trigger */}
                <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
                  <p className="text-xs font-semibold">Your files are ready for instant download:</p>
                  <a
                    href={selectedProduct.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow transition-all w-full justify-center"
                  >
                    <Download className="h-4 w-4" />
                    Download Digital Assets (.ZIP)
                  </a>
                </div>

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full rounded-xl border border-border py-2 text-xs font-semibold hover:bg-accent transition-colors"
                >
                  Close Receipt
                </button>
              </div>
            )}
            
            <div className="text-center">
              <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                Simulated 256-bit Stripe Secure Payment
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
