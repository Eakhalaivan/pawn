import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { JewelryItem } from '../lib/supabase';
import Footer from '../components/Footer';
import SeedButton from '../components/SeedButton';
import { Gem, ShoppingCart, Eye, Heart } from 'lucide-react';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import LiveMetalRates from '../components/LiveMetalRates';
import { TrustBadges } from '../components/TrustBadges';
import { localJewelryItems } from '../utils/localData';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useRates } from '../context/RateContext';
import { useWishlist } from '../context/WishlistContext';

const Jewelry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { cart, totalItems } = useCart();
  const { calculateProductPrice } = useRates();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartCheckout, setIsCartCheckout] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<{ name: string, price: number, weight: number, unit: string, image_url?: string }[]>([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedPurity, setSelectedPurity] = useState<string>('all');

  const [selectedProduct, setSelectedProduct] = useState<JewelryItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('checkout') === 'true' && totalItems > 0) {
      handleCheckoutCart();
    }
  }, [searchParams, totalItems]);

  useEffect(() => {
    fetchJewelryItems();
  }, []);

  const fetchJewelryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('jewelry_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setJewelryItems(data);
      } else {
        setJewelryItems(localJewelryItems);
      }
    } catch (error) {
      console.error('Error fetching jewelry items from Supabase, using local data:', error);
      setJewelryItems(localJewelryItems);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(jewelryItems.map(item => item.category)))];

  const getDynamicPrice = (item: JewelryItem) => {
    return calculateProductPrice(item.weight, item.metal_type, item.wastage_percent, item.price, item.name).totalPrice;
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = jewelryItems
    .filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const price = getDynamicPrice(item);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesPurity = selectedPurity === 'all' ||
        (selectedPurity === '24k' && (item.name || '').toLowerCase().includes('24k')) ||
        (selectedPurity === '22k' && !(item.name || '').toLowerCase().includes('24k') && item.metal_type === 'gold');
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesPrice && matchesPurity && matchesSearch;
    })
    .sort((a, b) => {
      const priceA = getDynamicPrice(a);
      const priceB = getDynamicPrice(b);
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getTotalPrice = () => {
    return Object.values(cart).reduce((sum, cartItem) => {
      const product = jewelryItems.find(p => p.id === cartItem.productId);
      if (!product) return sum;
      const price = calculateProductPrice(cartItem.weight, product.metal_type, product.wastage_percent, product.price, product.name).totalPrice;
      return sum + (price * cartItem.quantity);
    }, 0);
  };

  const handleBuyNow = (item: JewelryItem) => {
    const price = getDynamicPrice(item);
    setCheckoutItems([{
      name: item.name,
      price: price,
      weight: item.weight,
      unit: item.metal_type === 'diamond' ? 'ct' : 'g',
      image_url: item.image_url || undefined
    }]);
    setCheckoutTotal(price);
    setIsCartCheckout(false);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutCart = () => {
    const items = Object.values(cart).map(cartItem => {
      const product = jewelryItems.find(p => p.id === cartItem.productId);
      if (!product) return null;
      const price = calculateProductPrice(cartItem.weight, product.metal_type, product.wastage_percent, product.price, product.name).totalPrice;
      return {
        name: product.name,
        price: price * cartItem.quantity,
        weight: cartItem.weight,
        unit: product.metal_type === 'diamond' ? 'ct' : 'g',
        image_url: product.image_url
      };
    }).filter(Boolean) as { name: string, price: number, weight: number, unit: string, image_url?: string }[];

    setCheckoutItems(items);
    setCheckoutTotal(getTotalPrice());
    setIsCartCheckout(true);
    setIsCheckoutOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const openProductDetails = (item: JewelryItem) => {
    setSelectedProduct(item);
    setIsDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Gem className="h-12 w-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading jewelry collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LiveMetalRates />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Jewelry Collection</h1>
            <p className="text-gray-600">Exquisite collection with live market rates</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex-1">
            {/* Search Bar */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search jewelry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 text-sm font-medium text-gray-900 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 border border-transparent focus:border-purple-300"
              />
            </div>

            <div className="h-8 w-[1px] bg-gray-200 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 hidden lg:inline">Purity:</span>
              <select
                value={selectedPurity}
                onChange={(e) => setSelectedPurity(e.target.value)}
                className="bg-gray-50 text-sm font-bold text-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="all">Any Purity</option>
                <option value="24k">24K (Pure Gold)</option>
                <option value="22k">22K (Jewelry Gold)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 hidden lg:inline">Price:</span>
              <select
                value={`${priceRange[0]}-${priceRange[1]}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  setPriceRange([min, max]);
                }}
                className="bg-gray-50 text-sm font-bold text-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="0-1000000">Any Price</option>
                <option value="0-10000">Under ₹10,000</option>
                <option value="10000-50000">₹10,000 - ₹50,000</option>
                <option value="50000-200000">₹50,000 - ₹2,00,000</option>
                <option value="200000-1000000">Above ₹2,00,000</option>
              </select>
            </div>

            <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-sm font-bold text-purple-700 focus:outline-none cursor-pointer pr-2"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Reset Button */}
            {(searchQuery || selectedCategory !== 'all' || selectedPurity !== 'all' || priceRange[1] !== 1000000) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedPurity('all');
                  setPriceRange([0, 1000000]);
                  setSortBy('newest');
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Gem className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No jewelry items available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div
                  className="h-56 bg-gray-50 relative overflow-hidden cursor-pointer"
                  onClick={() => openProductDetails(item)}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <Gem className="h-16 w-16 text-gray-400" />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                      <Eye className="h-4 w-4" /> View Details
                    </button>
                  </div>
                  {item.metal_type !== 'none' && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{item.weight}g {item.metal_type}</span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(item.id);
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${isInWishlist(item.id)
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-white/50 text-gray-400 hover:bg-white/80 hover:text-red-500'
                      }`}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist(item.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-purple-700">{formatPrice(getDynamicPrice(item))}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">+ GST & Charges</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openProductDetails(item)}
                        className="bg-white border-2 border-purple-600 text-purple-600 py-2 rounded-xl hover:bg-purple-50 flex items-center justify-center text-sm font-bold transition-all"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleBuyNow(item)}
                        className="bg-purple-600 text-white py-2 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductDetailsModal
        item={selectedProduct}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={checkoutItems}
        totalAmount={checkoutTotal}
        isCartCheckout={isCartCheckout}
      />

      <TrustBadges />
      <Footer />
      <SeedButton />
    </div>
  );
};

export default Jewelry;
