import { 
  Menu, X, Sparkles, LogOut, LayoutDashboard, User, Moon, Sun, 
  ArrowRight, Bell, Check, ShoppingBag, Heart, Info, ArrowUpRight 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { localDb } from '../lib/supabase';
import { Notification } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: { id: string; email: string; username?: string } | null;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  user,
  onLogout,
  darkMode,
  onToggleDarkMode
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Poll notifications if logged in
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    async function fetchNotifications() {
      try {
        const data = await localDb.getNotifications(user!.id);
        setNotifications(data);
      } catch (err) {
        console.warn('Failed to load notifications:', err);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000); // Poll every 8s

    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await localDb.markNotificationsAsRead(user.id);
    const data = await localDb.getNotifications(user.id);
    setNotifications(data);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShoppingBag className="h-4.5 w-4.5" />
          </div>
        );
      case 'follow':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
            <Heart className="h-4.5 w-4.5 fill-pink-500/10" />
          </div>
        );
      case 'system':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Info className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-muted-foreground">
            <Bell className="h-4.5 w-4.5" />
          </div>
        );
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md transition-colors duration-200 border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Nuvix
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate('landing')}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                currentView === 'landing' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Explore
            </button>
            
            {user && (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    currentView === 'dashboard' ? 'text-indigo-500 font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
                {user.username && (
                  <button
                    onClick={() => onNavigate(`profile-${user.username}`)}
                    className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    My Bio Page
                  </button>
                )}
              </>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </button>

            {/* Notifications Icon (Desktop) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifPanel(!showNotifPanel)}
                  className={`rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-all relative cursor-pointer ${
                    showNotifPanel ? 'bg-accent text-foreground' : ''
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                <AnimatePresence>
                  {showNotifPanel && (
                    <>
                      {/* Backdrop for click away */}
                      <div className="fixed inset-0 z-30" onClick={() => setShowNotifPanel(false)}></div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 z-40 rounded-2xl border border-border bg-card p-4 shadow-2xl text-foreground"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm">Notifications</h4>
                            {unreadCount > 0 && (
                              <span className="bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Mark read
                            </button>
                          )}
                        </div>

                        <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`flex gap-3 text-xs p-2 rounded-xl transition-colors ${
                                  notif.read ? 'opacity-70 bg-transparent' : 'bg-indigo-500/5 font-medium'
                                }`}
                              >
                                {getNotifIcon(notif.type)}
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-foreground leading-tight">
                                    {notif.title}
                                  </p>
                                  <p className="text-muted-foreground leading-snug">
                                    {notif.content}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground font-mono">
                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                              <p className="text-xs">No notifications yet.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-border">
                <span className="text-xs text-muted-foreground hidden lg:inline max-w-[150px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <button
                  onClick={() => onNavigate('login')}
                  className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-accent transition-colors cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-indigo-500/10 cursor-pointer"
                >
                  Join Nuvix
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile navigation header trigger buttons */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </button>

            {/* Notifications Badge (Mobile) */}
            {user && (
              <button
                onClick={() => {
                  setShowNotifPanel(!showNotifPanel);
                  setIsOpen(false);
                }}
                className="rounded-full p-2 text-muted-foreground hover:bg-accent relative cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-pink-500"></span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(!isOpen);
                setShowNotifPanel(false);
              }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Notifications Panel Drawer */}
      <AnimatePresence>
        {showNotifPanel && (
          <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-md px-4 py-3 text-foreground space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="font-bold text-sm">Notifications ({unreadCount})</h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-indigo-500 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-52 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex gap-3 text-xs p-2.5 rounded-xl transition-colors ${
                      notif.read ? 'opacity-70 bg-transparent' : 'bg-indigo-500/5 font-medium border-l-2 border-indigo-500'
                    }`}
                  >
                    {getNotifIcon(notif.type)}
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{notif.title}</p>
                      <p className="text-muted-foreground leading-tight">{notif.content}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-muted-foreground py-4">No notifications.</p>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Main Route Menu */}
      {isOpen && (
        <div className="border-b border-border bg-background px-4 py-3 md:hidden space-y-2">
          <button
            onClick={() => {
              onNavigate('landing');
              setIsOpen(false);
            }}
            className={`block w-full text-left rounded-lg px-3 py-2 text-base font-medium cursor-pointer ${
              currentView === 'landing' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            Explore Creators
          </button>
          
          {user && (
            <>
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base font-medium cursor-pointer ${
                  currentView === 'dashboard' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <LayoutDashboard className="h-5 w-5 text-indigo-500" />
                Dashboard
              </button>
              {user.username && (
                <button
                  onClick={() => {
                    onNavigate(`profile-${user.username}`);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground cursor-pointer"
                >
                  <User className="h-5 w-5 text-purple-500" />
                  My Bio Page
                </button>
              )}
            </>
          )}

          <div className="pt-3 border-t border-border">
            {user ? (
              <div className="space-y-2">
                <p className="px-3 text-xs text-muted-foreground truncate">{user.email}</p>
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-red-500 hover:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-1">
                <button
                  onClick={() => {
                    onNavigate('login');
                    setIsOpen(false);
                  }}
                  className="rounded-lg border border-border py-2 text-center text-sm font-medium hover:bg-accent cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    onNavigate('signup');
                    setIsOpen(false);
                  }}
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-2 text-center text-sm font-medium text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 cursor-pointer"
                >
                  Join Nuvix
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
