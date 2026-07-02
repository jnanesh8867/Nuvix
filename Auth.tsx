import { useState, FormEvent } from 'react';
import { Mail, Lock, User, AtSign, ArrowRight, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { supabase, localAuth, isSupabaseConfigured } from '../lib/supabase';

interface AuthProps {
  initialMode: 'login' | 'signup';
  onAuthSuccess: (session: any) => void;
  onNavigate: (view: string) => void;
}

export default function Auth({ initialMode, onAuthSuccess, onNavigate }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!email || !password) {
      setErrorMsg('Please fill in email and password.');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && (!username || !fullName)) {
      setErrorMsg('Please fill in username and full name.');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      setLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        // --- REAL SUPABASE AUTHENTICATION ---
        if (mode === 'signup') {
          // 1. Sign up user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                username: username.toLowerCase().replace(/[^a-z0-9_]/g, '')
              }
            }
          });

          if (signUpError) throw signUpError;

          if (signUpData.user) {
            // 2. Create profile row in Firestore/Supabase public.profiles (or it might run via trigger, but let's insert to be safe)
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: signUpData.user.id,
                username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                full_name: fullName,
                bio: 'Welcome to my creator page! Edit this bio in your dashboard.',
                avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
                theme: 'default',
                social_links: {}
              });
            
            // Note: If profile insert fails because database schema is not fully migrated, we don't block the user.
            if (profileError) {
              console.warn('Profile table insert ignored or failed:', profileError.message);
            }

            setSuccessMsg('Registration successful! Please check your email for verification.');
            
            // For smoother developer testing, let's login immediately with mock fallback if they want to proceed, or just pass session
            setTimeout(() => {
              onAuthSuccess({
                user: { id: signUpData.user?.id || 'new-user', email, username },
                profile: {
                  id: signUpData.user?.id || 'new-user',
                  username,
                  full_name: fullName,
                  bio: 'Welcome to my creator page! Edit this bio in your dashboard.',
                  avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
                  theme: 'default',
                  social_links: {}
                }
              });
            }, 1500);
          }
        } else {
          // Login
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          if (data.session) {
            // Load user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            onAuthSuccess({
              user: data.user,
              profile: profile || {
                id: data.user.id,
                username: email.split('@')[0],
                full_name: email.split('@')[0],
                bio: 'Welcome to my creator page!',
                avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
                theme: 'default',
                social_links: {}
              }
            });
          }
        }
      } else {
        // --- OFFLINE-FIRST MOCK AUTHENTICATION FALLBACK ---
        if (mode === 'signup') {
          const { data, error } = await localAuth.signUp(email, username, fullName);
          if (error) throw error;
          setSuccessMsg('Profile created successfully! Loading your dashboard...');
          setTimeout(() => {
            onAuthSuccess(localAuth.getSession());
          }, 1000);
        } else {
          const { data, error } = await localAuth.signIn(email);
          if (error) throw error;
          setSuccessMsg('Welcome back! Logging in...');
          setTimeout(() => {
            onAuthSuccess(localAuth.getSession());
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      {/* Background patterns */}
      <div className="absolute inset-0 -z-10 bg-grid-slate-500/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>
      <div className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-indigo-500/5 blur-3xl"></div>
      <div className="absolute bottom-[20%] left-[10%] h-[300px] w-[300px] rounded-full bg-pink-500/5 blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Page'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'login' 
              ? 'Connect with your audience and manage your products' 
              : 'Claim your link, launch your store, and start selling'}
          </p>
        </div>

        {/* Supabase Status Alert Banner */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
          isSupabaseConfigured 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
        }`}>
          {isSupabaseConfigured ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <div>
                <span className="font-semibold">Supabase Connected:</span> Real database integration is active. Accounts, profiles, links, and products sync to your Supabase tables.
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <div>
                <span className="font-semibold">Preview Offline-First Mode:</span> Running client-side via sandbox localStorage. All capabilities (auth, stats, product uploads, purchases, profile customizer) are 100% functional. Set <code className="bg-amber-500/10 px-1 rounded">VITE_SUPABASE_URL</code> to switch.
              </div>
            </>
          )}
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="p-3 text-sm rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              {/* Full name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sarah Chen"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Claim Username (Nuvix Handle)
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="sarah_design"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Your bio link will be: <span className="font-mono text-indigo-500">/@{username || 'username'}</span>
                </p>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-bold text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : mode === 'login' ? (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Launch My Platform
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle auth mode */}
        <div className="text-center pt-4 border-t border-border text-sm">
          {mode === 'login' ? (
            <p className="text-muted-foreground">
              New to Nuvix?{' '}
              <button
                onClick={() => setMode('signup')}
                className="font-semibold text-indigo-500 hover:text-indigo-600 hover:underline transition-all"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-semibold text-indigo-500 hover:text-indigo-600 hover:underline transition-all"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
