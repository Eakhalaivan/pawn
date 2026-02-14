import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gem, Scale, LogOut, User, ShoppingBag, Heart, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CartDrawer } from './CartDrawer';
import { WishlistDrawer } from './WishlistDrawer';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { JewelryItem } from '../lib/supabase';
import { localJewelryItems } from '../utils/localData';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Navbar() {
  const navigate = useNavigate();
  const { cart, updateQuantity, totalItems } = useCart();
  const { wishlist } = useWishlist();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // Get initial user state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await supabase.from('jewelry_items').select('*');
        if (data && data.length > 0) {
          setJewelryItems(data);
        } else {
          setJewelryItems(localJewelryItems);
        }
      } catch (error) {
        setJewelryItems(localJewelryItems);
      }
    };
    fetchItems();
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!customer) return;

        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .eq('is_read', false);

        setUnreadNotifications(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Real-time subscription for new notifications
    const setupSubscription = async () => {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!customer) return;

      const subscription = supabase
        .channel('navbar_notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `customer_id=eq.${customer.id}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupSubscription();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-purple-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
            <Gem className="h-6 w-6" />
            <span>RCB jewelry's & Pawn shop</span>
          </Link>
          <div className="flex space-x-4">
            <Link to="/jewelry" className="hover:text-purple-200 flex items-center">
              <Gem className="h-5 w-5 mr-1" />
              Jewelry
            </Link>
            <Link to="/pawn" className="hover:text-purple-200 flex items-center">
              <Scale className="h-5 w-5 mr-1" />
              Pawn
            </Link>
            {/* Admin Link Removed - Admins must login via /admin/login */}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="p-2 hover:bg-purple-700 rounded-lg relative transition-colors text-red-100 hover:text-white"
          >
            <Heart className={`h-6 w-6 ${wishlist.length > 0 ? 'fill-current' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {wishlist.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2 hover:bg-purple-700 rounded-lg relative transition-colors"
          >
            <ShoppingBag className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </button>
          {user && (
            <Link
              to="/notifications"
              className="p-2 hover:bg-purple-700 rounded-lg relative transition-colors"
            >
              <Bell className="h-6 w-6" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>
          )}
          {!loading && (
            user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-purple-200 hover:text-white transition-colors group"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-700 flex items-center justify-center font-bold text-sm border border-purple-600 group-hover:border-white transition-all">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.email}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>Sign In</span>
              </Link>
            )
          )}
        </div>
      </div>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        items={jewelryItems}
        updateCart={updateQuantity}
        onCheckout={() => {
          setIsCartOpen(false);
          navigate('/jewelry?checkout=true');
        }}
      />
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={jewelryItems}
      />
    </nav>
  );
}