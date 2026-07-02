export interface CustomTheme {
  themeName: string;
  background: string;
  cardBg: string;
  primaryBtn: string;
  secondaryBtn: string;
  accentColor: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  theme: string; // 'default' | 'dark' | 'glassmorphism' | 'neo-brutalist' | 'emerald-glow' | 'sunset' | 'aurora'
  custom_theme?: CustomTheme;
  social_links: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    github?: string;
    linkedin?: string;
  };
  created_at?: string;
}

export interface LinkItem {
  id: string;
  user_id: string;
  title: string;
  url: string;
  icon?: string;
  is_active: boolean;
  clicks_count: number;
  created_at?: string;
}

export interface Product {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  cover_url: string;
  download_url: string;
  sales_count: number;
  is_active: boolean;
  created_at?: string;
}

export interface CreatorStats {
  views: number;
  clicks: number;
  revenue: number;
  sales: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'follow' | 'sale' | 'click' | 'system';
  read: boolean;
  created_at: string;
}

export interface Follower {
  id: string;
  follower_id: string;
  creator_id: string;
  created_at: string;
}
