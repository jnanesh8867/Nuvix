import { createClient } from '@supabase/supabase-js';
import { Profile, LinkItem, Product, Notification, Follower } from '../types';

// Read Supabase credentials from environment variables if present
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Check if we should use Supabase or fallback to Local/Mock mode
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// LOCAL/MOCK BACKEND STORAGE FOR PREVIEW MODE
// ==========================================

// Seed some initial demo data to make the app beautiful on load!
const DEFAULT_CREATORS: Record<string, { profile: Profile; links: LinkItem[]; products: Product[] }> = {
  sarah_design: {
    profile: {
      id: 'creator-sarah',
      username: 'sarah_design',
      full_name: 'Sarah Chen',
      bio: 'UI/UX Designer & Content Creator. Helping people design modern digital products. Check out my templates below!',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300&q=80',
      theme: 'glassmorphism',
      social_links: {
        twitter: 'https://twitter.com/sarah_design',
        instagram: 'https://instagram.com/sarah_design',
        youtube: 'https://youtube.com',
        github: 'https://github.com'
      }
    },
    links: [
      { id: 'l1', user_id: 'creator-sarah', title: 'My Design Newsletter (Weekly tips)', url: 'https://newsletter.sarahchen.design', clicks_count: 245, is_active: true },
      { id: 'l2', user_id: 'creator-sarah', title: 'Schedule a 1:1 Design Mentorship', url: 'https://calendly.com', clicks_count: 120, is_active: true },
      { id: 'l3', user_id: 'creator-sarah', title: 'Read my latest article on Medium', url: 'https://medium.com', clicks_count: 85, is_active: true }
    ],
    products: [
      {
        id: 'p1',
        user_id: 'creator-sarah',
        title: 'Ultimate Figma UI Kit 2026',
        description: 'Over 500+ customizable components, charts, dashboard components, and interactive prototypes built for React & Tailwind designers.',
        price: 29,
        cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=250&q=80',
        download_url: 'https://example.com/figma_kit_demo.zip',
        sales_count: 42,
        is_active: true
      },
      {
        id: 'p2',
        user_id: 'creator-sarah',
        title: 'Minimalist Icon Pack (120+ SVG)',
        description: 'Highly detailed custom minimalist icons perfect for landing pages, web apps, and presentation decks.',
        price: 12,
        cover_url: 'https://images.unsplash.com/photo-1614036417651-efe5912149d8?auto=format&fit=crop&w=400&h=250&q=80',
        download_url: 'https://example.com/icons_demo.zip',
        sales_count: 78,
        is_active: true
      }
    ]
  },
  jack_code: {
    profile: {
      id: 'creator-jack',
      username: 'jack_code',
      full_name: 'Jack Dev',
      bio: 'Fullstack Software Engineer & Content Creator. Sharing clean code, developer workflows, and premium boilerplate repos.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80',
      theme: 'neo-brutalist',
      social_links: {
        twitter: 'https://twitter.com',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com'
      }
    },
    links: [
      { id: 'l4', user_id: 'creator-jack', title: 'Subscribe on YouTube', url: 'https://youtube.com', clicks_count: 612, is_active: true },
      { id: 'l5', user_id: 'creator-jack', title: 'My GitHub Repositories', url: 'https://github.com', clicks_count: 450, is_active: true }
    ],
    products: [
      {
        id: 'p3',
        user_id: 'creator-jack',
        title: 'Next.js 15 Starter SaaS Boilerplate',
        description: 'Complete production-ready boilerplate with auth, payments (Stripe), email, landing page, and Prisma database schema configured.',
        price: 79,
        cover_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&h=250&q=80',
        download_url: 'https://example.com/saas_boilerplate.zip',
        sales_count: 18,
        is_active: true
      }
    ]
  }
};

// Local storage keys
const KEYS = {
  USERS: 'nuvix_users',
  PROFILES: 'nuvix_profiles',
  LINKS: 'nuvix_links',
  PRODUCTS: 'nuvix_products',
  SESSION: 'nuvix_session',
  STATS: 'nuvix_stats',
  FOLLOWERS: 'nuvix_followers',
  NOTIFICATIONS: 'nuvix_notifications'
};

// Initialize localStorage with dummy data if not present
const initializeLocalStorage = () => {
  if (!localStorage.getItem(KEYS.PROFILES)) {
    const profiles: Profile[] = [];
    const links: LinkItem[] = [];
    const products: Product[] = [];

    Object.values(DEFAULT_CREATORS).forEach((creator) => {
      profiles.push(creator.profile);
      links.push(...creator.links);
      products.push(...creator.products);
    });

    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
    localStorage.setItem(KEYS.LINKS, JSON.stringify(links));
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));

    // Stats
    const statsMap: Record<string, { views: number; clicks: number; revenue: number; sales: number }> = {
      'creator-sarah': { views: 1840, clicks: 450, revenue: 2154, sales: 120 },
      'creator-jack': { views: 920, clicks: 1062, revenue: 1422, sales: 18 }
    };
    localStorage.setItem(KEYS.STATS, JSON.stringify(statsMap));

    // Follower seed
    const initialFollowers: Follower[] = [
      { id: 'fol-seed-1', follower_id: 'creator-jack', creator_id: 'creator-sarah', created_at: new Date().toISOString() }
    ];
    localStorage.setItem(KEYS.FOLLOWERS, JSON.stringify(initialFollowers));

    // Notification seed
    const initialNotifications: Notification[] = [
      {
        id: 'not-seed-1',
        user_id: 'creator-sarah',
        title: 'Welcome to Nuvix!',
        content: 'Your professional creator workspace is ready. Generate premium bios and style your profile with AI.',
        type: 'system',
        read: false,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'not-seed-2',
        user_id: 'creator-sarah',
        title: 'New Follower!',
        content: 'Jack Dev (@jack_code) started following you.',
        type: 'follow',
        read: false,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'not-seed-3',
        user_id: 'creator-sarah',
        title: 'Digital Sale! 💰',
        content: 'Someone bought "Ultimate Figma UI Kit 2026" for $29!',
        type: 'sale',
        read: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
  }
};

initializeLocalStorage();

// Helper to get/set local storage items
const getLocalItem = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setLocalItem = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Local Auth API
export const localAuth = {
  signUp: async (email: string, username: string, fullName: string) => {
    // Check if username taken
    const profiles = getLocalItem<Profile>(KEYS.PROFILES);
    if (profiles.find(p => p.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username already taken.');
    }

    const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
    const newProfile: Profile = {
      id: userId,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      full_name: fullName,
      bio: 'Welcome to my creator page! Edit this bio in your dashboard.',
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
      theme: 'default',
      social_links: {}
    };

    // Save profile
    profiles.push(newProfile);
    setLocalItem(KEYS.PROFILES, profiles);

    // Save dummy login
    const session = { user: { id: userId, email }, profile: newProfile };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));

    // Initialize stats
    const stats = localStorage.getItem(KEYS.STATS) ? JSON.parse(localStorage.getItem(KEYS.STATS)!) : {};
    stats[userId] = { views: 0, clicks: 0, revenue: 0, sales: 0 };
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));

    return { data: { user: session.user }, error: null };
  },

  signIn: async (email: string) => {
    // In mock mode, we look for a profile or create one based on email name
    const profiles = getLocalItem<Profile>(KEYS.PROFILES);
    const mockUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Find or create
    let profile = profiles.find(p => p.username === mockUsername);
    let userId = '';

    if (!profile) {
      userId = `user-${Math.random().toString(36).substr(2, 9)}`;
      profile = {
        id: userId,
        username: mockUsername,
        full_name: mockUsername.charAt(0).toUpperCase() + mockUsername.slice(1),
        bio: 'Welcome to my creator page! Edit this bio in your dashboard.',
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${mockUsername}`,
        theme: 'default',
        social_links: {}
      };
      profiles.push(profile);
      setLocalItem(KEYS.PROFILES, profiles);

      // Initialize stats
      const stats = localStorage.getItem(KEYS.STATS) ? JSON.parse(localStorage.getItem(KEYS.STATS)!) : {};
      stats[userId] = { views: 0, clicks: 0, revenue: 0, sales: 0 };
      localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    } else {
      userId = profile.id;
    }

    const session = { user: { id: userId, email }, profile };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));

    return { data: { user: session.user, session }, error: null };
  },

  signOut: async () => {
    localStorage.removeItem(KEYS.SESSION);
    return { error: null };
  },

  getSession: () => {
    try {
      const data = localStorage.getItem(KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
};

// Local Database API
export const localDb = {
  getProfileByUsername: async (username: string): Promise<Profile | null> => {
    const profiles = getLocalItem<Profile>(KEYS.PROFILES);
    return profiles.find(p => p.username.toLowerCase() === username.toLowerCase()) || null;
  },

  getProfileById: async (id: string): Promise<Profile | null> => {
    const profiles = getLocalItem<Profile>(KEYS.PROFILES);
    return profiles.find(p => p.id === id) || null;
  },

  updateProfile: async (id: string, updates: Partial<Profile>): Promise<Profile> => {
    const profiles = getLocalItem<Profile>(KEYS.PROFILES);
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Profile not found');
    
    profiles[index] = { ...profiles[index], ...updates };
    setLocalItem(KEYS.PROFILES, profiles);

    // Update session cache if current user
    const currentSession = localAuth.getSession();
    if (currentSession && currentSession.user.id === id) {
      currentSession.profile = profiles[index];
      localStorage.setItem(KEYS.SESSION, JSON.stringify(currentSession));
    }

    return profiles[index];
  },

  getLinks: async (userId: string): Promise<LinkItem[]> => {
    const links = getLocalItem<LinkItem>(KEYS.LINKS);
    return links.filter(l => l.user_id === userId);
  },

  saveLink: async (link: Omit<LinkItem, 'id' | 'clicks_count'> & { id?: string }): Promise<LinkItem> => {
    const links = getLocalItem<LinkItem>(KEYS.LINKS);
    if (link.id) {
      // Edit
      const index = links.findIndex(l => l.id === link.id);
      if (index === -1) throw new Error('Link not found');
      const updated = { ...links[index], ...link } as LinkItem;
      links[index] = updated;
      setLocalItem(KEYS.LINKS, links);
      return updated;
    } else {
      // Create
      const newLink: LinkItem = {
        ...link,
        id: `link-${Math.random().toString(36).substr(2, 9)}`,
        clicks_count: 0
      };
      links.push(newLink);
      setLocalItem(KEYS.LINKS, links);
      return newLink;
    }
  },

  deleteLink: async (linkId: string): Promise<void> => {
    const links = getLocalItem<LinkItem>(KEYS.LINKS);
    const filtered = links.filter(l => l.id !== linkId);
    setLocalItem(KEYS.LINKS, filtered);
  },

  incrementLinkClick: async (linkId: string): Promise<void> => {
    const links = getLocalItem<LinkItem>(KEYS.LINKS);
    const index = links.findIndex(l => l.id === linkId);
    if (index !== -1) {
      links[index].clicks_count += 1;
      setLocalItem(KEYS.LINKS, links);

      // Increment aggregate clicks for creator
      const userId = links[index].user_id;
      const stats = localStorage.getItem(KEYS.STATS) ? JSON.parse(localStorage.getItem(KEYS.STATS)!) : {};
      if (stats[userId]) {
        stats[userId].clicks += 1;
        localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
      }
    }
  },

  getProducts: async (userId: string): Promise<Product[]> => {
    const products = getLocalItem<Product>(KEYS.PRODUCTS);
    return products.filter(p => p.user_id === userId);
  },

  saveProduct: async (product: Omit<Product, 'id' | 'sales_count'> & { id?: string }): Promise<Product> => {
    const products = getLocalItem<Product>(KEYS.PRODUCTS);
    if (product.id) {
      const index = products.findIndex(p => p.id === product.id);
      if (index === -1) throw new Error('Product not found');
      const updated = { ...products[index], ...product } as Product;
      products[index] = updated;
      setLocalItem(KEYS.PRODUCTS, products);
      return updated;
    } else {
      const newProduct: Product = {
        ...product,
        id: `prod-${Math.random().toString(36).substr(2, 9)}`,
        sales_count: 0
      };
      products.push(newProduct);
      setLocalItem(KEYS.PRODUCTS, products);
      return newProduct;
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    const products = getLocalItem<Product>(KEYS.PRODUCTS);
    const filtered = products.filter(p => p.id !== productId);
    setLocalItem(KEYS.PRODUCTS, filtered);
  },

  buyProduct: async (productId: string): Promise<void> => {
    const products = getLocalItem<Product>(KEYS.PRODUCTS);
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index].sales_count += 1;
      setLocalItem(KEYS.PRODUCTS, products);

      // Add to creator stats
      const userId = products[index].user_id;
      const stats = localStorage.getItem(KEYS.STATS) ? JSON.parse(localStorage.getItem(KEYS.STATS)!) : {};
      if (!stats[userId]) {
        stats[userId] = { views: 0, clicks: 0, revenue: 0, sales: 0 };
      }
      stats[userId].sales += 1;
      stats[userId].revenue += products[index].price;
      localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    }
  },

  getStats: async (userId: string) => {
    const stats = localStorage.getItem(KEYS.STATS) ? JSON.parse(localStorage.getItem(KEYS.STATS)!) : {};
    return stats[userId] || { views: 0, clicks: 0, revenue: 0, sales: 0 };
  },

  incrementProfileViews: async (userId: string): Promise<void> => {
    const stats = localStorage.getItem(KEYS.STATS) ? JSON.parse(localStorage.getItem(KEYS.STATS)!) : {};
    if (!stats[userId]) {
      stats[userId] = { views: 0, clicks: 0, revenue: 0, sales: 0 };
    }
    stats[userId].views += 1;
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  getAllProfiles: async (): Promise<Profile[]> => {
    return getLocalItem<Profile>(KEYS.PROFILES);
  },

  getFollowersCount: async (userId: string): Promise<number> => {
    const followers = getLocalItem<Follower>(KEYS.FOLLOWERS);
    return followers.filter(f => f.creator_id === userId).length;
  },

  getFollowingCount: async (userId: string): Promise<number> => {
    const followers = getLocalItem<Follower>(KEYS.FOLLOWERS);
    return followers.filter(f => f.follower_id === userId).length;
  },

  isFollowing: async (followerId: string, creatorId: string): Promise<boolean> => {
    const followers = getLocalItem<Follower>(KEYS.FOLLOWERS);
    return followers.some(f => f.follower_id === followerId && f.creator_id === creatorId);
  },

  followCreator: async (followerId: string, creatorId: string): Promise<void> => {
    const followers = getLocalItem<Follower>(KEYS.FOLLOWERS);
    const exists = followers.some(f => f.follower_id === followerId && f.creator_id === creatorId);
    if (!exists) {
      followers.push({
        id: `fol-${Math.random().toString(36).substr(2, 9)}`,
        follower_id: followerId,
        creator_id: creatorId,
        created_at: new Date().toISOString()
      });
      setLocalItem(KEYS.FOLLOWERS, followers);

      // Add notification to creator
      const followerProfile = await localDb.getProfileById(followerId);
      const followerName = followerProfile?.full_name || `@${followerProfile?.username || 'Someone'}`;
      await localDb.addNotification(creatorId, {
        user_id: creatorId,
        title: 'New Follower!',
        content: `${followerName} started following you.`,
        type: 'follow'
      });
    }
  },

  unfollowCreator: async (followerId: string, creatorId: string): Promise<void> => {
    const followers = getLocalItem<Follower>(KEYS.FOLLOWERS);
    const filtered = followers.filter(f => !(f.follower_id === followerId && f.creator_id === creatorId));
    setLocalItem(KEYS.FOLLOWERS, filtered);
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    const notifications = getLocalItem<Notification>(KEYS.NOTIFICATIONS);
    return notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addNotification: async (userId: string, notification: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<void> => {
    const notifications = getLocalItem<Notification>(KEYS.NOTIFICATIONS);
    notifications.push({
      ...notification,
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      created_at: new Date().toISOString()
    });
    setLocalItem(KEYS.NOTIFICATIONS, notifications);
  },

  markNotificationsAsRead: async (userId: string): Promise<void> => {
    const notifications = getLocalItem<Notification>(KEYS.NOTIFICATIONS);
    notifications.forEach(n => {
      if (n.user_id === userId) {
        n.read = true;
      }
    });
    setLocalItem(KEYS.NOTIFICATIONS, notifications);
  }
};
