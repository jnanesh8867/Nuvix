/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PublicProfile from './components/PublicProfile';
import { Profile } from './types';
import { supabase, localAuth, localDb, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [user, setUser] = useState<{ id: string; email: string; username?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true); // Default to gorgeous dark mode!

  // Toggle Dark Mode class on index.html body/root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle Dynamic URL routing for deep-linking (e.g., /@username or custom profiles)
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/@')) {
        const username = hash.replace('#/@', '');
        setCurrentView(`profile-${username}`);
      } else if (hash === '#/dashboard') {
        setCurrentView('dashboard');
      } else if (hash === '#/login') {
        setCurrentView('login');
      } else if (hash === '#/signup') {
        setCurrentView('signup');
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    handleLocationChange(); // Read on mount

    return () => window.removeEventListener('hashchange', handleLocationChange);
  }, []);

  // Sync state to URL hash
  const navigateTo = (view: string) => {
    if (view === 'landing') {
      window.location.hash = '';
    } else if (view === 'dashboard') {
      window.location.hash = '/dashboard';
    } else if (view === 'login') {
      window.location.hash = '/login';
    } else if (view === 'signup') {
      window.location.hash = '/signup';
    } else if (view.startsWith('profile-')) {
      const username = view.replace('profile-', '');
      window.location.hash = `/@${username}`;
    }
    setCurrentView(view);
  };

  // Check auth session on startup
  useEffect(() => {
    async function checkSession() {
      try {
        if (isSupabaseConfigured && supabase) {
          // --- REAL SUPABASE SESSION CHECK ---
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const loggedInUser = data.session.user;
            
            // Get profile details
            const { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', loggedInUser.id)
              .single();

            const profileObj: Profile = dbProfile || {
              id: loggedInUser.id,
              username: loggedInUser.email?.split('@')[0] || 'creator',
              full_name: loggedInUser.user_metadata?.full_name || 'Creator',
              bio: 'Welcome to my creator page!',
              avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${loggedInUser.email}`,
              theme: 'default',
              social_links: {}
            };

            setUser({
              id: loggedInUser.id,
              email: loggedInUser.email || '',
              username: profileObj.username
            });
            setProfile(profileObj);
          }
        } else {
          // --- OFFLINE MOCK SESSION CHECK ---
          const session = localAuth.getSession();
          if (session && session.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              username: session.profile.username
            });
            setProfile(session.profile);
          }
        }
      } catch (err) {
        console.warn('Session loading failed:', err);
      }
    }
    checkSession();
  }, []);

  const handleAuthSuccess = (session: any) => {
    if (session && session.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        username: session.profile?.username || session.user.username
      });
      setProfile(session.profile);
      navigateTo('dashboard');
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      await localAuth.signOut();
    }
    setUser(null);
    setProfile(null);
    navigateTo('landing');
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    if (user) {
      setUser({ ...user, username: updatedProfile.username });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      
      {/* Universal Navigation bar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Primary dynamic view rendering */}
      <main className="flex-grow">
        {currentView === 'landing' && (
          <LandingPage onNavigate={navigateTo} />
        )}

        {(currentView === 'login' || currentView === 'signup') && (
          <Auth
            initialMode={currentView}
            onAuthSuccess={handleAuthSuccess}
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'dashboard' && user && profile && (
          <Dashboard
            user={user}
            initialProfile={profile}
            onProfileUpdate={handleProfileUpdate}
            onNavigate={navigateTo}
          />
        )}

        {/* Dynamic username viewer: /@username */}
        {currentView.startsWith('profile-') && (
          <PublicProfile
            username={currentView.replace('profile-', '')}
            onNavigate={navigateTo}
            viewerSession={user}
          />
        )}
      </main>

    </div>
  );
}
