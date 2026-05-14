import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Please click the "Connect to Supabase" button in the top right to set up your Supabase project.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type MetalType = 'gold' | 'silver' | 'diamond' | 'platinum' | 'none';

export type JewelryItem = {
  id: string;
  name: string;
  description: string | null;
  price: number; // This will be the base/fixed price or calculated price
  category: string;
  image_url: string | null;
  metal_type: MetalType;
  weight: number; // weight in grams
  wastage_percent: number;
  created_at: string;
  updated_at: string;
};

export type PawnRequest = {
  id: string;
  user_id: string;
  item_description: string;
  requested_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  customer_id: string;
  notification_type: 'monthly_interest' | 'payment_reminder' | 'pledge_status' | 'general';
  title: string;
  message: string;
  pledge_id: string | null;
  interest_amount: number | null;
  total_amount: number | null;
  is_read: boolean;
  sent_via_email: boolean;
  email_sent_at: string | null;
  created_at: string;
};