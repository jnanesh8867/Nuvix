import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { 
  User as UserIcon, Link2, ShoppingBag, BarChart3, Palette, Plus, Trash2, Edit2, 
  ExternalLink, Save, Check, Globe, Eye, ArrowUpRight, DollarSign, MousePointerClick, 
  TrendingUp, Sparkles, Upload, Image as ImageIcon, CheckCircle, AlertTriangle, AlertCircle
} from 'lucide-react';
import { Profile, LinkItem, Product, CreatorStats } from '../types';
import { supabase, localDb, isSupabaseConfigured } from '../lib/supabase';

interface DashboardProps {
  user: { id: string; email: string; username?: string } | null;
  initialProfile: Profile;
  onProfileUpdate: (newProfile: Profile) => void;
  onNavigate: (view: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
];

const THEMES = [
  { id: 'default', name: 'Classic Slate', desc: 'Minimal charcoal and pure whites', bg: 'bg-slate-50 dark:bg-slate-900', accent: 'bg-slate-800' },
  { id: 'glassmorphism', name: 'Cosmic Glass', desc: 'Futuristic blurs and subtle neon', bg: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950', accent: 'bg-indigo-500/20' },
  { id: 'neo-brutalist', name: 'Retro Yellow', desc: 'Bold outlines and high-contrast yellow', bg: 'bg-amber-100', accent: 'bg-yellow-400 border-2 border-slate-900' },
  { id: 'emerald-glow', name: 'Emerald Oasis', desc: 'Lush forest greens and soft glows', bg: 'bg-slate-950', accent: 'bg-emerald-500/10' },
  { id: 'sunset', name: 'Warm Sunset', desc: 'Vibrant oranges and golden gradients', bg: 'bg-gradient-to-tr from-amber-500 to-pink-600', accent: 'bg-white/20' },
  { id: 'aurora', name: 'Aurora Borealis', desc: 'Cool blues and mystic cyan pulses', bg: 'bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950', accent: 'bg-cyan-500/20' }
];

export default function Dashboard({ user, initialProfile, onProfileUpdate, onNavigate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'products' | 'analytics'>('profile');
  
  // Profile State
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.full_name);
  const [bio, setBio] = useState(initialProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url);
  const [selectedTheme, setSelectedTheme] = useState(initialProfile.theme);
  const [socialLinks, setSocialLinks] = useState(initialProfile.social_links || {});
  
  // Links State
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  
  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdCover, setNewProdCover] = useState('');
  const [newProdDownload, setNewProdDownload] = useState('');

  // General States
  const [stats, setStats] = useState<CreatorStats>({ views: 0, clicks: 0, revenue: 0, sales: 0 });
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // --- AI MODAL & GENERATOR STATE ---
  const [showAiBioModal, setShowAiBioModal] = useState(false);
  const [aiTone, setAiTone] = useState('creative');
  const [aiKeywords, setAiKeywords] = useState('');
  const [generatingBio, setGeneratingBio] = useState(false);

  const [showAiUsernameModal, setShowAiUsernameModal] = useState(false);
  const [aiNiche, setAiNiche] = useState('tech, digital art');
  const [aiUsernames, setAiUsernames] = useState<string[]>([]);
  const [generatingUsername, setGeneratingUsername] = useState(false);

  const [aiThemePrompt, setAiThemePrompt] = useState('');
  const [generatingTheme, setGeneratingTheme] = useState(false);

  // --- AI HANDLERS ---
  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const res = await fetch('/api/ai/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone: aiTone, keywords: aiKeywords, currentBio: bio })
      });
      const data = await res.json();
      if (data.success && data.bio) {
        setBio(data.bio);
        setShowAiBioModal(false);
        triggerStatus('success', 'Gemini AI generated biography successfully applied!');
      } else {
        triggerStatus('error', data.error || 'Failed to generate biography');
      }
    } catch (err) {
      triggerStatus('error', 'Network failure during AI Bio generation.');
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleGenerateUsernames = async () => {
    setGeneratingUsername(true);
    try {
      const res = await fetch('/api/ai/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, niche: aiNiche })
      });
      const data = await res.json();
      if (data.success && data.usernames) {
        setAiUsernames(data.usernames);
        triggerStatus('success', 'Generated 5 high-converting usernames!');
      } else {
        triggerStatus('error', data.error || 'Failed to generate usernames');
      }
    } catch (err) {
      triggerStatus('error', 'Network error generating suggestions.');
    } finally {
      setGeneratingUsername(false);
    }
  };

  const handleGenerateTheme = async () => {
    if (!aiThemePrompt.trim()) return;
    setGeneratingTheme(true);
    try {
      const res = await fetch('/api/ai/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePrompt: aiThemePrompt })
      });
      const data = await res.json();
      if (data.success && data.theme) {
        const generated = data.theme;
        // Stringify theme structure and set as theme
        const themeString = JSON.stringify(generated);
        setSelectedTheme(themeString);
        triggerStatus('success', `AI Theme "${generated.themeName}" designed and applied!`);
      } else {
        triggerStatus('error', data.error || 'Failed to design custom theme');
      }
    } catch (err) {
      triggerStatus('error', 'Network error during AI Theme creation.');
    } finally {
      setGeneratingTheme(false);
    }
  };

  const pageUrl = `${window.location.origin}/#/@${user?.username || 'username'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pageUrl)}`;

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `nuvix-qr-${user?.username || 'creator'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      triggerStatus('success', 'Nuvix creator QR Code downloaded successfully!');
    } catch (err) {
      window.open(qrCodeUrl, '_blank');
    }
  };

  const handleExportReport = () => {
    const reportData = {
      creator: user?.username || 'handle',
      displayName: fullName,
      generatedAt: new Date().toISOString(),
      performanceSummary: {
        totalViews: stats.views,
        totalClicks: stats.clicks,
        totalSales: stats.sales,
        totalRevenue: stats.revenue,
        linkCTR: stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) + '%' : '0%',
        salesConversion: stats.views > 0 ? ((stats.sales / stats.views) * 100).toFixed(1) + '%' : '0%'
      },
      navigationLinks: links.map(l => ({
        title: l.title,
        url: l.url,
        clicks: l.clicks_count || 0,
        active: l.is_active
      })),
      digitalStore: products.map(p => ({
        title: p.title,
        price: p.price,
        copiesSold: p.sales_count || 0,
        totalEarned: (p.sales_count || 0) * p.price
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `nuvix-creator-report-${user?.username || 'analytics'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    triggerStatus('success', 'Nuvix analytical report downloaded successfully!');
  };

  useEffect(() => {
    // Reload fields when initialProfile changes (e.g., loaded after signin)
    setProfile(initialProfile);
    setFullName(initialProfile.full_name);
    setBio(initialProfile.bio);
    setAvatarUrl(initialProfile.avatar_url);
    setSelectedTheme(initialProfile.theme);
    setSocialLinks(initialProfile.social_links || {});
  }, [initialProfile]);

  // Load user data
  useEffect(() => {
    if (!user) return;
    
    async function loadData() {
      try {
        if (isSupabaseConfigured && supabase) {
          // --- LOAD FROM REAL SUPABASE ---
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (dbProfile) {
            setProfile(dbProfile);
            setFullName(dbProfile.full_name);
            setBio(dbProfile.bio);
            setAvatarUrl(dbProfile.avatar_url);
            setSelectedTheme(dbProfile.theme);
            setSocialLinks(dbProfile.social_links || {});
          }

          const { data: dbLinks } = await supabase
            .from('links')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
          if (dbLinks) setLinks(dbLinks);

          const { data: dbProducts } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
          if (dbProducts) setProducts(dbProducts);

          // Real analytics can count rows, or aggregate clicks
          const totalClicks = dbLinks?.reduce((acc, curr) => acc + (curr.clicks_count || 0), 0) || 0;
          const totalSales = dbProducts?.reduce((acc, curr) => acc + (curr.sales_count || 0), 0) || 0;
          const totalRev = dbProducts?.reduce((acc, curr) => acc + ((curr.sales_count || 0) * curr.price), 0) || 0;
          
          setStats({
            views: totalClicks * 2.4 + 120, // Simple scale for visual richness
            clicks: totalClicks,
            sales: totalSales,
            revenue: totalRev
          });
        } else {
          // --- LOAD FROM OFFLINE MOCK STORAGE ---
          const mockProfile = await localDb.getProfileById(user.id);
          if (mockProfile) {
            setProfile(mockProfile);
            setFullName(mockProfile.full_name);
            setBio(mockProfile.bio);
            setAvatarUrl(mockProfile.avatar_url);
            setSelectedTheme(mockProfile.theme);
            setSocialLinks(mockProfile.social_links || {});
          }

          const mockLinks = await localDb.getLinks(user.id);
          setLinks(mockLinks);

          const mockProducts = await localDb.getProducts(user.id);
          setProducts(mockProducts);

          const mockStats = await localDb.getStats(user.id);
          setStats(mockStats);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }
    loadData();
  }, [user]);

  // Show status timer
  const triggerStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => {
      setStatusMsg(null);
    }, 4000);
  };

  // Profile Save
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updatedProfile: Profile = {
        ...profile,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
        theme: selectedTheme,
        social_links: socialLinks
      };

      if (isSupabaseConfigured && supabase) {
        // Update Supabase profiles table
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            bio,
            avatar_url: avatarUrl,
            theme: selectedTheme,
            social_links: socialLinks
          })
          .eq('id', user.id);
        
        if (error) throw error;
      } else {
        // Local mode update
        await localDb.updateProfile(user.id, updatedProfile);
      }

      setProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      triggerStatus('success', 'Profile customized and saved successfully!');
    } catch (err: any) {
      console.error(err);
      triggerStatus('error', err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  // Preset avatar selector
  const handlePresetAvatar = (url: string) => {
    setAvatarUrl(url);
    triggerStatus('success', 'Preset avatar selected! Save profile to update live page.');
  };

  // File Selector simulation for Uploading Avatar
  const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Reading base64 representation to show immediately and save
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);

        if (isSupabaseConfigured && supabase) {
          try {
            // Simulation of Supabase bucket upload
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id || 'avatar'}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // We attempt upload
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, file);

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
              if (publicUrlData?.publicUrl) {
                setAvatarUrl(publicUrlData.publicUrl);
                triggerStatus('success', 'Uploaded successfully to Supabase Storage!');
                return;
              }
            }
          } catch (storageErr) {
            console.warn('Storage upload failed, keeping base64 fallback:', storageErr);
          }
        }
        triggerStatus('success', 'Local avatar file loaded successfully! Remember to Save.');
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LINKS API HANDLERS ---
  const handleAddLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newLinkTitle || !newLinkUrl) return;
    
    try {
      const formattedUrl = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`;
      const newLinkPayload = {
        user_id: user.id,
        title: newLinkTitle,
        url: formattedUrl,
        is_active: true
      };

      let addedLink: LinkItem;

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('links')
          .insert(newLinkPayload)
          .select()
          .single();
        if (error) throw error;
        addedLink = data;
      } else {
        addedLink = await localDb.saveLink(newLinkPayload);
      }

      setLinks([...links, addedLink]);
      setNewLinkTitle('');
      setNewLinkUrl('');
      triggerStatus('success', 'Link added successfully!');
    } catch (err: any) {
      console.error(err);
      triggerStatus('error', err.message || 'Failed to add link');
    }
  };

  const handleToggleLinkActive = async (linkId: string, currentStatus: boolean) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('links')
          .update({ is_active: !currentStatus })
          .eq('id', linkId);
        if (error) throw error;
      } else {
        const link = links.find(l => l.id === linkId);
        if (link) {
          await localDb.saveLink({ ...link, is_active: !currentStatus });
        }
      }

      setLinks(links.map(l => l.id === linkId ? { ...l, is_active: !currentStatus } : l));
      triggerStatus('success', 'Link visibility toggled!');
    } catch (err: any) {
      console.error(err);
      triggerStatus('error', err.message || 'Failed to toggle link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('links')
          .delete()
          .eq('id', linkId);
        if (error) throw error;
      } else {
        await localDb.deleteLink(linkId);
      }

      setLinks(links.filter(l => l.id !== linkId));
      triggerStatus('success', 'Link deleted!');
    } catch (err: any) {
      console.error(err);
      triggerStatus('error', err.message || 'Failed to delete link');
    }
  };

  // --- PRODUCTS API HANDLERS ---
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !newProdTitle || !newProdPrice) return;

    try {
      const defaultCover = newProdCover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=250&q=80';
      const defaultDownload = newProdDownload || 'https://example.com/download_file.zip';

      const productPayload = {
        user_id: user.id,
        title: newProdTitle,
        description: newProdDesc,
        price: Number(newProdPrice),
        cover_url: defaultCover,
        download_url: defaultDownload,
        is_active: true
      };

      let addedProduct: Product;

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('products')
          .insert(productPayload)
          .select()
          .single();
        if (error) throw error;
        addedProduct = data;
      } else {
        addedProduct = await localDb.saveProduct(productPayload);
      }

      setProducts([...products, addedProduct]);
      setNewProdTitle('');
      setNewProdDesc('');
      setNewProdPrice(0);
      setNewProdCover('');
      setNewProdDownload('');
      triggerStatus('success', 'Digital product listed in your store!');
    } catch (err: any) {
      console.error(err);
      triggerStatus('error', err.message || 'Failed to add product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);
        if (error) throw error;
      } else {
        await localDb.deleteProduct(productId);
      }

      setProducts(products.filter(p => p.id !== productId));
      triggerStatus('success', 'Product deleted!');
    } catch (err: any) {
      console.error(err);
      triggerStatus('error', err.message || 'Failed to delete product');
    }
  };

  // --- PREVIEW THEME COLOR RESOLVER ---
  let previewBg = 'bg-slate-50 dark:bg-slate-900 text-foreground';
  let previewCard = 'bg-white dark:bg-card border border-border text-foreground hover:bg-accent/40';
  let previewText = 'text-foreground';
  let previewAccent = 'text-indigo-400 font-semibold';
  let previewBorder = 'border-border';
  let previewAvatarRing = '';

  if (selectedTheme && selectedTheme.startsWith('{')) {
    try {
      const parsedTheme = JSON.parse(selectedTheme);
      previewBg = parsedTheme.background;
      previewCard = parsedTheme.cardBg;
      previewText = parsedTheme.accentColor;
      previewAccent = parsedTheme.accentColor;
      previewBorder = `border-${parsedTheme.accentColor.split('-')[1] || 'indigo'}-500/20`;
      previewAvatarRing = `ring-4 ring-offset-2 ${parsedTheme.accentColor}`;
    } catch (e) {
      // ignore
    }
  } else if (selectedTheme === 'glassmorphism') {
    previewBg = 'bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 text-white min-h-screen';
    previewCard = 'bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/10';
    previewAccent = 'text-pink-400 font-semibold';
  } else if (selectedTheme === 'neo-brutalist') {
    previewBg = 'bg-amber-100 text-slate-950';
    previewCard = 'bg-white hover:bg-slate-50 text-slate-950 border-2 border-slate-950';
    previewAccent = 'text-slate-800';
  } else if (selectedTheme === 'emerald-glow') {
    previewBg = 'bg-slate-950 text-white';
    previewCard = 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20';
    previewAccent = 'text-emerald-400 font-semibold';
  } else if (selectedTheme === 'sunset') {
    previewBg = 'bg-gradient-to-tr from-amber-500 to-pink-600 text-white';
    previewCard = 'bg-white/20 hover:bg-white/30 text-white';
    previewAccent = 'text-amber-200';
  } else if (selectedTheme === 'aurora') {
    previewBg = 'bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 text-white';
    previewCard = 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20';
    previewAccent = 'text-cyan-400';
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Creator Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            Managing public handle: 
            <span className="font-semibold text-indigo-500 hover:underline cursor-pointer flex items-center gap-0.5" onClick={() => onNavigate(`profile-${user?.username}`)}>
              @{user?.username || 'username'} <Globe className="h-3 w-3" />
            </span>
          </p>
        </div>
        
        {/* Quick visit buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(`profile-${user?.username}`)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent hover:border-accent transition-all shadow-sm"
          >
            <Eye className="h-4 w-4 text-indigo-500" />
            View Live Bio Page
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {statusMsg && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-lg flex items-center gap-2.5 max-w-md animate-bounce ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
            : 'bg-red-500/15 border-red-500/30 text-red-500'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="text-sm font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Layout Grid: Left Settings Panel + Right Mobile Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: EDITING INTERFACE (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Section Selector Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
                activeTab === 'profile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              Customize Bio Profile
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
                activeTab === 'links' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Link2 className="h-4 w-4" />
              Link-in-Bio Builder
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
                activeTab === 'products' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Digital Product Store
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
                activeTab === 'analytics' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Creator Analytics
            </button>
          </div>

          {/* TAB CONTENT: PROFILE CUSTOMIZATION */}
          {activeTab === 'profile' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Customize Profile Branding</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Define your display name, bio, high-resolution avatar, custom themes, and social connections.</p>
              </div>

              {/* Avatar Uploader & Preset Selector */}
              <div className="space-y-4 pt-4 border-t border-border">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Avatar Picture
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Avatar current display */}
                  <div className="relative group shrink-0">
                    <img 
                      src={avatarUrl} 
                      alt="Avatar Preview" 
                      referrerPolicy="no-referrer"
                      className="h-20 w-20 rounded-2xl object-cover ring-2 ring-indigo-500/50" 
                    />
                  </div>

                  {/* Manual file upload & presets */}
                  <div className="space-y-3 w-full">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-accent hover:border-accent cursor-pointer transition-all shadow-sm">
                        <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                        Upload Custom Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarFileChange} 
                        />
                      </label>
                      <button 
                        onClick={() => setAvatarUrl(`https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'nuvix'}`)}
                        className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent transition-all"
                      >
                        Reset to Vector Art
                      </button>
                    </div>

                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5 font-semibold">Or choose from our premium preset creator avatars:</p>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePresetAvatar(url)}
                            className={`h-9 w-9 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                              avatarUrl === url ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' : 'border-transparent hover:border-indigo-500/30'
                            }`}
                          >
                            <img src={url} alt="preset avatar" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="E.g., Sarah Chen"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAiUsernameModal(true)}
                      className="text-xs text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Suggest Creative AI Usernames
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Short Creator Biography
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAiBioModal(true)}
                      className="text-xs text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      Generate Bio with AI
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="E.g., Full-time designer making templates..."
                  />
                </div>
              </div>

              {/* Theme Selector */}
              <div className="pt-4 border-t border-border space-y-3">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Page Theme Selection
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between h-24 ${
                        selectedTheme === t.id 
                          ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20' 
                          : 'border-border bg-card hover:bg-accent/40 hover:border-border-accent'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-foreground">{t.name}</span>
                        {selectedTheme === t.id && <Check className="h-4 w-4 text-indigo-500" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground leading-snug">{t.desc}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`h-2.5 w-6 rounded ${t.bg} border border-border`}></div>
                        <div className={`h-2.5 w-2.5 rounded-full ${t.accent}`}></div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* AI Theme Designer Box */}
                <div className="mt-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Theme Designer</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Describe your perfect page vibe (e.g., <span className="italic font-medium">"sunset lavender cozy cafe"</span>, <span className="italic font-medium">"minimalist brutalist black and red"</span>, or <span className="italic font-medium">"sakura bubblegum dream"</span>) and Gemini will engineer custom colors, buttons, and matching backgrounds!
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiThemePrompt}
                      onChange={(e) => setAiThemePrompt(e.target.value)}
                      placeholder="E.g., synthwave neon cyberpunk night"
                      className="flex-grow px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      disabled={generatingTheme || !aiThemePrompt.trim()}
                      onClick={handleGenerateTheme}
                      className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-600 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {generatingTheme ? 'Designing...' : 'Design Theme'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="pt-4 border-t border-border space-y-4">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Social Media Connections
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Twitter / X Link</label>
                    <input
                      type="text"
                      value={socialLinks.twitter || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                      placeholder="https://twitter.com/username"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Instagram Link</label>
                    <input
                      type="text"
                      value={socialLinks.instagram || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                      placeholder="https://instagram.com/username"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">YouTube Link</label>
                    <input
                      type="text"
                      value={socialLinks.youtube || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                      placeholder="https://youtube.com/c/channel"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">GitHub Link</label>
                    <input
                      type="text"
                      value={socialLinks.github || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-5 border-t border-border flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Profile Customizations
                    </>
                  )}
                </button>
              </div>

              {/* QR Code Sharing and PWA Widget */}
              <div className="pt-6 border-t border-border grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-indigo-500" />
                    Share Your Creator Hub
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    This is your unique Nuvix handle page link. Copy it to your Instagram bio, TikTok profile, or YouTube descriptions to track real-time link click analytics and product sales.
                  </p>
                  
                  {/* Share link block */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pageUrl}
                      onClick={(e) => {
                        (e.target as HTMLInputElement).select();
                      }}
                      className="flex-grow px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs font-mono text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pageUrl);
                        triggerStatus('success', 'Nuvix page link copied to clipboard!');
                      }}
                      className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-500 transition-all cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>

                  {/* PWA Support Banner */}
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-1">
                    <p className="text-[11px] font-bold text-foreground flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      PWA Support Installed
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Nuvix is fully offline-capable and supports Native App Installation. Click your browser's "Add to Home Screen" or "Install" icon to pin Nuvix onto your desktop/mobile launchbar.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-muted/20 rounded-2xl border border-border space-y-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-border">
                    <img 
                      src={qrCodeUrl} 
                      alt="Creator QR Code" 
                      className="h-28 w-28 object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="w-full text-center py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all shadow-sm cursor-pointer"
                  >
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: LINK-IN-BIO BUILDER */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              {/* Add Link form */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Add Custom Navigation Link</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Publish buttons redirecting your followers to external portfolios, social groups, articles, or resources.</p>
                </div>

                <form onSubmit={handleAddLink} className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-5">
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Link Title / Label</label>
                    <input
                      type="text"
                      required
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="My Weekly Figma Tips Newsletter"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Destination URL</label>
                    <input
                      type="text"
                      required
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="newsletter.mybrand.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-600 transition-all cursor-pointer h-[38px]"
                    >
                      <Plus className="h-4 w-4" />
                      Publish Link
                    </button>
                  </div>
                </form>
              </div>

              {/* Links list */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4">Your Active Navigation Links</h3>
                
                {links.length > 0 ? (
                  <div className="space-y-3.5">
                    {links.map((lnk) => (
                      <div
                        key={lnk.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition-all gap-4"
                      >
                        <div className="min-w-0 flex-grow">
                          <h4 className="text-sm font-bold text-foreground truncate">{lnk.title}</h4>
                          <p className="text-[11px] text-muted-foreground truncate hover:underline cursor-pointer flex items-center gap-0.5 mt-0.5" onClick={() => window.open(lnk.url, '_blank')}>
                            {lnk.url} <ExternalLink className="h-2.5 w-2.5" />
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono font-semibold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                              {lnk.clicks_count || 0} clicks
                            </span>
                            {!lnk.is_active && (
                              <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                Invisible
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleLinkActive(lnk.id, lnk.is_active)}
                            className={`rounded-lg p-2 border text-xs font-semibold transition-all ${
                              lnk.is_active 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                            }`}
                          >
                            {lnk.is_active ? 'Visible' : 'Hidden'}
                          </button>
                          <button
                            onClick={() => handleDeleteLink(lnk.id)}
                            className="rounded-lg p-2 border border-border hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-all"
                            aria-label="Delete link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">No links published yet. Add your first link above!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: DIGITAL PRODUCT STORE */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Product lister */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Launch a Digital Product</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Sell eBooks, presets, Notion guides, boilerplate templates, icon files, or design documents natively in your bio.</p>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-4 mt-5 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8">
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Product Name</label>
                      <input
                        type="text"
                        required
                        value={newProdTitle}
                        onChange={(e) => setNewProdTitle(e.target.value)}
                        placeholder="Ultimate UI Kit Template Bundle"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Price (USD $)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={newProdPrice || ''}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        placeholder="29"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Brief Description</label>
                    <textarea
                      rows={2}
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      placeholder="Write 1-2 sentences about what buyers will receive in this digital download..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cover Image URL (Optional)</label>
                      <input
                        type="text"
                        value={newProdCover}
                        onChange={(e) => setNewProdCover(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Delivery Download Link (ZIP/PDF URL)</label>
                      <input
                        type="text"
                        value={newProdDownload}
                        onChange={(e) => setNewProdDownload(e.target.value)}
                        placeholder="https://drive.google.com/.../file.zip"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      List Product in Shop
                    </button>
                  </div>
                </form>
              </div>

              {/* Product Store list */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4">Your Store Products</h3>

                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-border overflow-hidden bg-muted/5 flex flex-col justify-between"
                      >
                        <img 
                          src={p.cover_url} 
                          alt={p.title} 
                          referrerPolicy="no-referrer"
                          className="h-32 w-full object-cover border-b border-border" 
                        />
                        <div className="p-4 flex-grow">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-foreground line-clamp-1">{p.title}</h4>
                            <span className="text-xs font-bold text-indigo-500 shrink-0">${p.price}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {p.description || 'No description provided.'}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-[10px] font-mono">
                            <span className="text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md font-semibold">
                              {p.sales_count || 0} sales
                            </span>
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold">
                              ${(p.sales_count || 0) * p.price} earned
                            </span>
                          </div>
                        </div>
                        <div className="p-4 border-t border-border/60 flex justify-end gap-2 bg-muted/15">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border border-border hover:bg-red-500/15 hover:text-red-500 hover:border-red-500/20 text-muted-foreground rounded-lg transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">Your store is currently empty. List your first product above!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Interactive Performance Analytics</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Review your traffic growth, button clicks, digital item sales, and total cumulative revenue.</p>
              </div>

              {/* Stats bento layout */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Page Views</span>
                    <Eye className="h-4 w-4 text-sky-500" />
                  </div>
                  <p className="text-2xl font-black text-foreground">{stats.views || 0}</p>
                  <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> +14.2% this week
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Link Clicks</span>
                    <MousePointerClick className="h-4 w-4 text-indigo-500" />
                  </div>
                  <p className="text-2xl font-black text-foreground">{stats.clicks || 0}</p>
                  <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> +8.5% this week
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Product Sales</span>
                    <ShoppingBag className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-black text-foreground">{stats.sales || 0}</p>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Avg. conversion 4.2%
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Gross Income</span>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-black text-foreground">${stats.revenue || 0}</p>
                  <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> New record!
                  </span>
                </div>
              </div>

              {/* Custom SVG Growth Chart */}
              <div className="p-5 border border-border rounded-xl bg-muted/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Weekly Traffic Curve</h4>
                  <span className="text-xs text-muted-foreground">Mon - Sun Cumulative Clicks</span>
                </div>
                
                {/* Responsive Chart Graphic */}
                <div className="h-32 w-full flex items-end justify-between gap-1.5 pt-4">
                  {[35, 48, 62, 41, 75, 92, 110].map((height, idx) => (
                    <div key={idx} className="flex-grow flex flex-col items-center gap-2">
                      <div className="w-full relative group">
                        {/* Tooltip */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {height}
                        </div>
                        {/* Bar */}
                        <div 
                          className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-500 group-hover:from-indigo-600 transition-all duration-300 shadow shadow-indigo-500/10 cursor-pointer"
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-foreground">Growth Recommendation</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Creators listing at least 2 digital products see a 240% increase in clicks. Add an email newsletter opt-in or calendar link to maximize your audience engagement.
                  </p>
                </div>
              </div>

              {/* Detailed Performance Breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                
                {/* Navigation Links clicks breakdown */}
                <div className="p-5 border border-border rounded-xl bg-muted/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="h-4 w-4 text-indigo-500" />
                      Link CTR Breakdown
                    </h4>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-semibold px-2 py-0.5 rounded-full">Active Links ({links.length})</span>
                  </div>
                  
                  {links.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                      {links.map((l) => {
                        const linkCTR = stats.views > 0 ? ((l.clicks_count || 0) / stats.views * 100).toFixed(1) : '0.0';
                        return (
                          <div key={l.id} className="p-3 bg-card border border-border rounded-xl space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs font-bold text-foreground truncate max-w-[180px]">{l.title}</span>
                              <span className="text-[10px] font-mono font-semibold text-indigo-500">{l.clicks_count || 0} clicks</span>
                            </div>
                            <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, parseFloat(linkCTR) * 5)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                              <span className="truncate max-w-[150px]">{l.url}</span>
                              <span>{linkCTR}% CTR</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-6 text-center">No links to display telemetry for.</p>
                  )}
                </div>

                {/* Digital products sales table */}
                <div className="p-5 border border-border rounded-xl bg-muted/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-purple-500" />
                      Product Sales Tracker
                    </h4>
                    <span className="text-[10px] bg-purple-500/10 text-purple-500 font-semibold px-2 py-0.5 rounded-full">Store Catalog ({products.length})</span>
                  </div>

                  {products.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                      {products.map((p) => {
                        const earned = (p.sales_count || 0) * p.price;
                        const productConv = stats.views > 0 ? ((p.sales_count || 0) / stats.views * 100).toFixed(1) : '0.0';
                        return (
                          <div key={p.id} className="p-3 bg-card border border-border rounded-xl flex items-center gap-3">
                            <img src={p.cover_url} referrerPolicy="no-referrer" className="h-11 w-11 object-cover rounded-lg shrink-0 border border-border" />
                            <div className="min-w-0 flex-grow space-y-1">
                              <h5 className="text-xs font-bold text-foreground truncate">{p.title}</h5>
                              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                                <span>{p.sales_count || 0} copies sold</span>
                                <span className="text-emerald-500 font-bold">${earned} gross</span>
                              </div>
                              <div className="flex justify-between text-[9px] font-mono font-medium text-purple-500">
                                <span>Price: ${p.price}</span>
                                <span>{productConv}% CR</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-6 text-center">No listed products found.</p>
                  )}
                </div>
              </div>

              {/* Data Export Center */}
              <div className="p-5 border border-border rounded-xl bg-muted/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Analytical Export Center</h4>
                  <p className="text-[11px] text-muted-foreground">Download your absolute creator dataset including full logs, sales history, link CTR, and custom configurations.</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="rounded-xl border border-indigo-500 text-indigo-500 hover:bg-indigo-500/5 px-5 py-2.5 text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  Download Performance Report (.JSON)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: MOBIL PHONE LIVE PREVIEW (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24 hidden lg:block">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1.5">
              Live Phone Mockup
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </span>
          </div>

          {/* iPhone Shell Wrapper */}
          <div className="border-[10px] border-slate-900 rounded-[40px] aspect-[9/18] overflow-hidden shadow-2xl bg-card relative">
            {/* Camera notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-28 bg-slate-900 rounded-b-2xl z-40 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-800"></div>
            </div>

            {/* Simulated Frame content */}
            <div className="h-full w-full overflow-y-auto no-scrollbar pt-6 pb-4">
              
              {/* Inside dynamic render with selected Theme */}
              <div className={`min-h-full p-5 space-y-5 flex flex-col items-center transition-all ${previewBg}`}>

                {/* Profile header inside phone */}
                <div className="text-center space-y-2 mt-4 flex flex-col items-center">
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    referrerPolicy="no-referrer"
                    className={`h-16 w-16 rounded-full object-cover shadow-md ${
                      selectedTheme === 'neo-brutalist' ? 'border-2 border-slate-950' : 
                      previewAvatarRing || 'ring-2 ring-white/20'
                    }`}
                  />
                  <div>
                    <h3 className={`font-bold text-sm ${
                      selectedTheme === 'neo-brutalist' ? 'text-slate-950' : 
                      previewText.includes('text-') ? previewText : 'text-foreground'
                    }`}>
                      {fullName || 'Your Name'}
                    </h3>
                    <p className={`text-xs ${
                      selectedTheme === 'neo-brutalist' ? 'text-slate-800' : 
                      previewAccent.includes('text-') ? previewAccent : 'text-indigo-400 font-semibold'
                    }`}>
                      @{user?.username || 'handle'}
                    </p>
                  </div>
                  <p className="text-[11px] text-center max-w-[220px] line-clamp-2 leading-normal opacity-80">
                    {bio || 'Write a custom bio to share who you are with your visitors.'}
                  </p>
                </div>

                {/* Social icons row inside phone */}
                <div className="flex gap-2 justify-center py-1">
                  {Object.entries(socialLinks).map(([platform, val]) => {
                    if (!val) return null;
                    return (
                      <div 
                        key={platform} 
                        className={`p-1.5 rounded-lg text-xs opacity-80 hover:opacity-100 ${
                          selectedTheme === 'neo-brutalist' ? 'bg-white border border-slate-950 text-slate-950' : 'bg-white/10 text-white'
                        }`}
                      >
                        <span className="capitalize font-semibold text-[10px]">{platform.substring(0,2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Links inside phone */}
                <div className="w-full space-y-2.5">
                  {links.filter(l => l.is_active).map((l) => (
                    <div
                      key={l.id}
                      className={`w-full p-2.5 rounded-xl text-center text-xs font-bold shadow-sm transition-all ${
                        selectedTheme && selectedTheme.startsWith('{') ? `${previewCard} border ${previewBorder}` :
                        selectedTheme === 'glassmorphism' ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/10' :
                        selectedTheme === 'neo-brutalist' ? 'bg-white hover:bg-slate-50 text-slate-950 border-2 border-slate-950' :
                        selectedTheme === 'emerald-glow' ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                        selectedTheme === 'sunset' ? 'bg-white/20 hover:bg-white/30 text-white' :
                        selectedTheme === 'aurora' ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' :
                        'bg-white dark:bg-card hover:bg-accent border border-border text-foreground'
                      }`}
                    >
                      {l.title}
                    </div>
                  ))}
                </div>

                {/* Products inside phone */}
                {products.length > 0 && (
                  <div className="w-full space-y-2 pt-3 border-t border-white/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-center opacity-75">Product Shop</h4>
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className={`rounded-xl overflow-hidden text-left flex gap-2 p-1.5 border ${
                          selectedTheme && selectedTheme.startsWith('{') ? `${previewCard} ${previewBorder}` :
                          selectedTheme === 'glassmorphism' ? 'bg-white/5 border-white/10 text-white' :
                          selectedTheme === 'neo-brutalist' ? 'bg-white border-2 border-slate-950 text-slate-950' :
                          selectedTheme === 'emerald-glow' ? 'bg-slate-900 border-emerald-500/10 text-white' :
                          'bg-white dark:bg-card border-border text-foreground'
                        }`}
                      >
                        <img src={p.cover_url} referrerPolicy="no-referrer" className="h-10 w-10 object-cover rounded-lg" />
                        <div className="min-w-0 flex-grow py-0.5">
                          <h5 className="text-[10px] font-bold truncate leading-tight">{p.title}</h5>
                          <p className="text-[9px] text-indigo-400 font-bold mt-0.5">${p.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI BIO GENERATION MODAL */}
      {showAiBioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                <h3 className="text-base font-extrabold text-foreground">AI Biography Engineer</h3>
              </div>
              <button 
                onClick={() => setShowAiBioModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Define your custom tone, keywords, and skills. Gemini AI will craft a high-conversion, professional biography for your Nuvix bio page!
            </p>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Tone Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {['creative', 'professional', 'minimalist', 'casual', 'energetic', 'mystic'].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setAiTone(tone)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all cursor-pointer ${
                        aiTone === tone 
                          ? 'bg-indigo-500 border-indigo-500 text-white' 
                          : 'border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Creator Niche, Skills, or Keywords</label>
                <input
                  type="text"
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  placeholder="e.g. UX Designer, Figma tips, traveler"
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-muted/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAiBioModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={generatingBio}
                  onClick={handleGenerateBio}
                  className="px-5 py-2 text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {generatingBio ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                      Engineering Bio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate & Apply
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI USERNAME SUGGESTIONS MODAL */}
      {showAiUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                <h3 className="text-base font-extrabold text-foreground">AI Username Suggestions</h3>
              </div>
              <button 
                onClick={() => {
                  setShowAiUsernameModal(false);
                  setAiUsernames([]);
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Stuck on handles? Share your creator niche, and Gemini will generate 5 optimized, memorable usernames tailored for conversion and discovery!
            </p>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Niche, Vibe, or Category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiNiche}
                    onChange={(e) => setAiNiche(e.target.value)}
                    placeholder="e.g. design, coffee lover, dev"
                    className="flex-grow px-3 py-2 border border-border rounded-xl text-xs bg-muted/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={generatingUsername}
                    onClick={handleGenerateUsernames}
                    className="px-4 py-2 text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl transition-all shadow disabled:opacity-50 cursor-pointer"
                  >
                    {generatingUsername ? 'Thinking...' : 'Suggest'}
                  </button>
                </div>
              </div>

              {aiUsernames.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-500 font-semibold">Suggested Creator Handles</label>
                  <p className="text-[10px] text-muted-foreground">Click a handle to copy to your clipboard!</p>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {aiUsernames.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(u);
                          triggerStatus('success', `Copied "@${u}"! You can update your Nuvix URL handle.`);
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl border border-border bg-muted/10 hover:bg-indigo-500/5 hover:border-indigo-500/20 text-xs font-mono text-foreground flex items-center justify-between group transition-all cursor-pointer"
                      >
                        <span>@{u}</span>
                        <span className="text-[10px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAiUsernameModal(false);
                    setAiUsernames([]);
                  }}
                  className="px-5 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
