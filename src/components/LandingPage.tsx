import { ArrowRight, Sparkles, ShoppingBag, Link as LinkIcon, BarChart3, Palette, ShieldCheck, Search, Users, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { localDb } from '../lib/supabase';
import { Profile } from '../types';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const all = await localDb.getAllProfiles();
        setProfiles(all);
      } catch (err) {
        console.error('Error loading profiles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(
    (p) =>
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative overflow-hidden bg-background">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-full max-w-7xl -translate-x-1/2 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]">
        <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 via-purple-500/5 to-transparent"></div>
        <div className="absolute top-[-10%] left-[10%] h-[350px] w-[350px] rounded-full bg-indigo-500/15 blur-3xl animate-pulse duration-5000"></div>
        <div className="absolute top-[5%] right-[10%] h-[350px] w-[350px] rounded-full bg-pink-500/15 blur-3xl animate-pulse duration-7000"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-24 pb-20">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-500 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            The Ultimate Creator Platform
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground font-sans leading-[1.15]">
            One Link to Showcase, Sell, and{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Grow Your Empire
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Nuvix is the modern link-in-bio platform for next-gen creators. Host your profile, build beautiful custom links, and sell digital products natively with Supabase.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('signup')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Claim your link
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                const searchEl = document.getElementById('creator-directory');
                if (searchEl) searchEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-base font-semibold hover:bg-accent transition-all"
            >
              Explore creators
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 sm:mt-32">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to succeed as a creator
            </h2>
            <p className="text-muted-foreground text-lg">
              No complex websites. No monthly subscriptions. Build a beautiful home for your audience in 5 minutes.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <LinkIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Link-in-Bio Builder</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Add highly interactive custom links, newsletter signups, calendar links, and visual accents to guide your audience.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Digital Product Shop</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Sell PDFs, templates, code boilerplate, music, or design kits natively right from your public profile with automatic file downloads.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                <Palette className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Stunning Visual Themes</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Choose from highly curated design styles: Glassmorphism, Neon-Brutalist, Emerald Glow, or Sunset to match your unique brand identity.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Advanced Analytics</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Keep track of your growth. Monitor link click-through rates, product sales revenue, profile views, and audience locations.
              </p>
            </div>
          </div>
        </div>

        {/* Creator Directory Showcase */}
        <div id="creator-directory" className="mt-28 sm:mt-36 pt-16 border-t border-border">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Meet Our Top Creators
            </h2>
            <p className="text-muted-foreground text-lg">
              Explore profiles, buy digital products, and see Nuvix live in action.
            </p>

            {/* Search Box */}
            <div className="relative max-w-md mx-auto mt-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators by name, handle, or category..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48 mt-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="relative group rounded-2xl border border-border bg-card hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Theme Accent Bar */}
                  <div className={`h-2.5 w-full bg-gradient-to-r ${
                    profile.theme === 'emerald-glow' ? 'from-emerald-400 to-teal-500' :
                    profile.theme === 'neo-brutalist' ? 'from-yellow-400 to-orange-500' :
                    profile.theme === 'glassmorphism' ? 'from-sky-400 to-indigo-500' :
                    'from-indigo-500 via-purple-500 to-pink-500'
                  }`}></div>

                  <div className="p-6 flex-grow">
                    <div className="flex items-center gap-4">
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        referrerPolicy="no-referrer"
                        className="h-14 w-14 rounded-xl object-cover ring-2 ring-border group-hover:ring-indigo-500/50 transition-all duration-300"
                      />
                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-indigo-500 transition-colors">
                          {profile.full_name}
                        </h3>
                        <p className="text-sm text-indigo-500 font-medium">
                          @{profile.username}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>

                  <div className="p-6 border-t border-border/60 bg-muted/20 flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground bg-accent/50 px-2 py-1 rounded-md capitalize">
                      {profile.theme} Theme
                    </span>
                    <button
                      onClick={() => onNavigate(`profile-${profile.username}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      Visit Bio Link
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 mt-12 bg-card rounded-2xl border border-dashed border-border max-w-md mx-auto">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">No creators found</p>
              <p className="text-xs text-muted-foreground mt-1">Try searching for "sarah" or "jack"</p>
            </div>
          )}
        </div>

        {/* Call to action section */}
        <div className="mt-32 rounded-3xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-950 p-8 sm:p-12 lg:p-16 border border-indigo-900/30 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 h-40 w-40 bg-pink-500/10 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full"></div>

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Are you ready to claim your corner of the internet?
            </h2>
            <p className="text-indigo-200/80 text-base sm:text-lg">
              Set up your profile, list your templates or digital downloads, share your links, and build your digital business with Nuvix. Free to start.
            </p>
            <div className="pt-4">
              <button
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-lg hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Claim My Free Page Now
                <ArrowRight className="h-4.5 w-4.5 text-slate-950" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
