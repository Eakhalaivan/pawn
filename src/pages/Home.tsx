import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Scale, Star, ShoppingCart, Eye, Heart, Sparkles, TrendingUp, Award, RefreshCw } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { JewelryItem } from '../lib/supabase';
import Footer from '../components/Footer';
import SeedButton from '../components/SeedButton';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import LiveMetalRates from '../components/LiveMetalRates';
import { TrustBadges } from '../components/TrustBadges';
import { localJewelryItems } from '../utils/localData';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useRates } from '../context/RateContext';
import { useWishlist } from '../context/WishlistContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
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
    const [searchQuery, setSearchQuery] = useState('');

    const heroRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const catalogRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

    useEffect(() => {
        if (searchParams.get('checkout') === 'true' && totalItems > 0) {
            handleCheckoutCart();
        }
    }, [searchParams, totalItems]);

    useEffect(() => {
        fetchJewelryItems();
    }, []);

    // GSAP Animations
    useEffect(() => {
        if (!loading) {
            // Hero animations
            const heroTimeline = gsap.timeline();
            heroTimeline
                .from('.hero-title', {
                    y: 100,
                    opacity: 0,
                    duration: 1,
                    ease: 'power4.out'
                })
                .from('.hero-subtitle', {
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power3.out'
                }, '-=0.5')
                .from('.hero-buttons', {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.out'
                }, '-=0.4');

            // Floating animation for decorative elements
            gsap.to('.floating-gem', {
                y: -20,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'power1.inOut'
            });

            // Features scroll animation
            gsap.from('.feature-card', {
                scrollTrigger: {
                    trigger: featuresRef.current,
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none reverse'
                },
                y: 100,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power3.out'
            });

            // Catalog header animation
            gsap.from('.catalog-header', {
                scrollTrigger: {
                    trigger: catalogRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                x: -100,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
            });

            return () => {
                ScrollTrigger.getAll().forEach(trigger => trigger.kill());
            };
        }
    }, [loading]);

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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                    >
                        <Gem className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    </motion.div>
                    <motion.p
                        className="text-yellow-100/80 text-xl font-serif tracking-widest uppercase"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        Loading Collections...
                    </motion.p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            {/* Hero Section with Parallax */}
            <motion.div
                ref={heroRef}
                className="relative h-screen overflow-hidden bg-black"
                style={{ opacity: heroOpacity }}
            >
                <motion.div
                    className="absolute inset-0"
                    style={{ scale: heroScale }}
                >
                    <img
                        src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=2000&q=80"
                        alt="High-end Jewelry Showcase"
                        className="w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/40 to-black/95" />
                </motion.div>

                {/* Floating Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="floating-gem absolute top-20 left-10"
                        animate={{
                            y: [0, -30, 0],
                            rotate: [0, 180, 360],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Sparkles className="h-12 w-12 text-yellow-200/40" />
                    </motion.div>
                    <motion.div
                        className="floating-gem absolute top-40 right-20"
                        animate={{
                            y: [0, -40, 0],
                            rotate: [360, 180, 0],
                            opacity: [0.2, 0.5, 0.2]
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    >
                        <Gem className="h-16 w-16 text-yellow-500/30" />
                    </motion.div>
                </div>

                {/* Hero Content */}
                <div className="relative h-full flex items-center justify-center px-4">
                    <div className="text-center text-white max-w-5xl">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <motion.div
                                className="inline-block mb-8"
                                animate={{
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Gem className="h-24 w-24 mx-auto text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                            </motion.div>
                        </motion.div>

                        <h1 className="hero-title text-6xl md:text-8xl font-serif font-bold mb-8 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
                            Timeless Luxury
                        </h1>
                        <p className="hero-subtitle text-xl md:text-2xl mb-12 font-light text-gray-300 max-w-2xl mx-auto tracking-wide leading-relaxed">
                            Discover an exquisite collection where elegance meets investment.
                            <span className="block mt-2 text-yellow-500/80 font-serif italic">Crafted for eternity.</span>
                        </p>

                        <motion.div
                            className="hero-buttons flex flex-col sm:flex-row justify-center gap-6"
                            whileHover={{ scale: 1.02 }}
                        >
                            <motion.a
                                href="#jewelry-collection"
                                className="group relative bg-yellow-500 text-black px-12 py-4 rounded-full flex items-center justify-center text-lg font-bold shadow-[0_0_20px_rgba(234,179,8,0.3)] overflow-hidden"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <motion.div
                                    className="absolute inset-0 bg-white"
                                    initial={{ x: "-100%" }}
                                    whileHover={{ x: "100%" }}
                                    transition={{ duration: 0.5 }}
                                    style={{ opacity: 0.2 }}
                                />
                                <span className="relative z-10 flex items-center tracking-wide">
                                    BROWSE COLLECTION
                                </span>
                            </motion.a>

                            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    to="/pawn"
                                    className="group relative bg-black/40 backdrop-blur-md text-white px-12 py-4 rounded-full flex items-center justify-center text-lg font-bold border border-white/20 hover:border-yellow-500/50 hover:text-yellow-400 transition-colors"
                                >
                                    <span className="tracking-wide">PAWN SERVICES</span>
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Scroll Indicator */}
                        <motion.div
                            className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="flex flex-col items-center gap-2 opacity-50">
                                <span className="text-[10px] tracking-[0.2em] text-yellow-200">SCROLL</span>
                                <div className="w-[1px] h-12 bg-gradient-to-b from-yellow-200 to-transparent"></div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Features Section */}
            <div ref={featuresRef} className="relative bg-zinc-50 py-24 px-4 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, #000000 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                <div className="container mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                            Why Choose <span className="text-yellow-600">Us</span>
                        </h2>
                        <div className="w-24 h-1 bg-yellow-500 mx-auto mb-6"></div>
                        <p className="text-xl text-gray-600 font-light">Experience excellence in every interaction</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Gem,
                                title: "Exquisite Jewelry",
                                description: "Discover our curated collection of fine jewelry, from stunning diamonds to precious gemstones.",
                                delay: 0
                            },
                            {
                                icon: Scale,
                                title: "Pawn Services",
                                description: "Quick and confidential pawn loans with competitive rates on jewelry, watches, and precious metals.",
                                delay: 0.2
                            },
                            {
                                icon: Award,
                                title: "Expert Appraisals",
                                description: "Professional evaluation services by certified gemologists and jewelry experts.",
                                delay: 0.4
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                className="feature-card group relative"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: feature.delay }}
                                whileHover={{ y: -10 }}
                            >
                                <motion.div
                                    className="bg-white p-10 rounded-xl shadow-[0_5px_30px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_40px_-5px_rgba(0,0,0,0.1)] transition-all duration-500 h-full border border-gray-100 group-hover:border-yellow-200 relative overflow-hidden"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    {/* Icon with Animation */}
                                    <motion.div
                                        className="relative mb-6"
                                        whileHover={{ rotate: 360, scale: 1.1 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <div className="inline-flex p-4 rounded-full bg-black">
                                            <feature.icon className="h-8 w-8 text-yellow-500" />
                                        </div>
                                    </motion.div>

                                    <h3 className="text-2xl font-serif font-bold mb-4 text-gray-900 group-hover:text-yellow-600 transition-colors duration-300">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-500 leading-relaxed font-light">
                                        {feature.description}
                                    </p>

                                    {/* Decorative Corner */}
                                    <motion.div
                                        className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-100/50 to-transparent rounded-bl-full"
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        transition={{ delay: feature.delay + 0.3 }}
                                    />
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Jewelry Collection Section */}
            <div id="jewelry-collection" ref={catalogRef} className="min-h-screen bg-zinc-50">
                <LiveMetalRates />

                <div className="container mx-auto py-16 px-4">
                    <motion.div
                        className="catalog-header flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div>
                            <span className="text-yellow-600 font-bold tracking-widest uppercase text-sm mb-2 block">Our Masterpieces</span>
                            <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-4">
                                Jewelry Collection
                            </h1>
                            <p className="text-xl text-gray-500 font-light flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-yellow-600" />
                                Updated with live market rates
                            </p>
                        </div>
                    </motion.div>

                    {/* Filters */}
                    <motion.div
                        className="mb-10 flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex flex-wrap gap-3">
                            {categories.map((category, index) => (
                                <motion.button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-8 py-3 rounded-full capitalize font-medium transition-all duration-300 ${selectedCategory === category
                                        ? 'bg-black text-white shadow-xl scale-105 border border-black'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-black/30'
                                        }`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {category}
                                </motion.button>
                            ))}
                        </div>

                        <motion.div
                            className="flex flex-wrap gap-4 items-center bg-white p-2 pl-6 rounded-full border border-gray-200 shadow-sm w-full xl:w-auto"
                            whileHover={{ boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05)" }}
                        >
                            {/* Search Bar */}
                            <div className="flex-1 min-w-[200px]">
                                <motion.input
                                    type="text"
                                    placeholder="Search collection..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent text-sm font-medium text-gray-900 py-3 focus:outline-none placeholder-gray-400"
                                />
                            </div>

                            <div className="h-8 w-[1px] bg-gray-200 hidden md:block"></div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedPurity}
                                    onChange={(e) => setSelectedPurity(e.target.value)}
                                    className="bg-transparent text-sm font-medium text-gray-700 py-3 pr-8 focus:outline-none cursor-pointer hover:text-black"
                                >
                                    <option value="all">Any Purity</option>
                                    <option value="24k">24K Gold</option>
                                    <option value="22k">22K Gold</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={`${priceRange[0]}-${priceRange[1]}`}
                                    onChange={(e) => {
                                        const [min, max] = e.target.value.split('-').map(Number);
                                        setPriceRange([min, max]);
                                    }}
                                    className="bg-transparent text-sm font-medium text-gray-700 py-3 pr-8 focus:outline-none cursor-pointer hover:text-black"
                                >
                                    <option value="0-1000000">Any Price</option>
                                    <option value="0-10000">Under ₹10k</option>
                                    <option value="10000-50000">₹10k - ₹50k</option>
                                    <option value="50000-200000">₹50k - ₹2L</option>
                                    <option value="200000-1000000">Above ₹2L</option>
                                </select>
                            </div>

                            <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>

                            <div className="flex items-center gap-2 pr-4">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-transparent text-sm font-bold text-black focus:outline-none cursor-pointer"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                </select>
                            </div>

                            {/* Reset Button */}
                            <AnimatePresence>
                                {(searchQuery || selectedCategory !== 'all' || selectedPurity !== 'all' || priceRange[1] !== 1000000) && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedCategory('all');
                                            setSelectedPurity('all');
                                            setPriceRange([0, 1000000]);
                                            setSortBy('newest');
                                        }}
                                        className="bg-gray-100 text-gray-500 hover:text-red-500 p-2 rounded-full m-1"
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>

                    {/* Products Grid */}
                    {filteredItems.length === 0 ? (
                        <motion.div
                            className="text-center py-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <Gem className="h-20 w-20 text-gray-200 mx-auto mb-6" />
                            <p className="text-gray-400 text-xl font-light">No masterpieces found matching your criteria</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            <AnimatePresence>
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: index * 0.05,
                                            type: "spring",
                                            stiffness: 100
                                        }}
                                        whileHover={{ y: -10 }}
                                        className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100"
                                    >
                                        <div
                                            className="h-72 bg-gray-50 relative overflow-hidden cursor-pointer"
                                            onClick={() => openProductDetails(item)}
                                        >
                                            {item.image_url ? (
                                                <motion.img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ duration: 0.8 }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gray-100">
                                                    <Gem className="h-20 w-20 text-gray-300" />
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <motion.div
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                                                initial={{ opacity: 0 }}
                                                whileHover={{ opacity: 1 }}
                                            >
                                                <motion.button
                                                    className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-2xl tracking-wide text-sm"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <Eye className="h-4 w-4" /> VIEW DETAILS
                                                </motion.button>
                                            </motion.div>

                                            {/* Metal Badge */}
                                            {item.metal_type !== 'none' && (
                                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md shadow-sm border border-gray-100">
                                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                                                        {item.weight}g {item.metal_type}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Wishlist Button */}
                                            <motion.button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(item.id);
                                                }}
                                                className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${isInWishlist(item.id)
                                                    ? 'bg-red-500 text-white shadow-lg'
                                                    : 'bg-white/80 text-gray-500 hover:bg-white hover:text-red-500 shadow-sm'
                                                    }`}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Heart className={`h-5 w-5 ${isInWishlist(item.id) ? 'fill-current' : ''}`} />
                                            </motion.button>
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-6">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-serif font-bold text-gray-900 mb-1 group-hover:text-yellow-700 transition-colors line-clamp-1">
                                                    {item.name}
                                                </h3>
                                                <p className="text-xs text-gray-400 capitalize font-medium tracking-widest">{item.category}</p>
                                            </div>

                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <span className="text-2xl font-bold text-gray-900 block">
                                                        {formatPrice(getDynamicPrice(item))}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">+ Tax & Charges</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <motion.button
                                                        onClick={() => openProductDetails(item)}
                                                        className="bg-transparent border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:border-black hover:text-black hover:bg-gray-50 flex items-center justify-center text-sm font-bold transition-all"
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        Details
                                                    </motion.button>
                                                    <motion.button
                                                        onClick={() => handleBuyNow(item)}
                                                        className="bg-black text-white py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                                                        whileHover={{ scale: 1.02, backgroundColor: "#1f2937" }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <ShoppingCart className="h-4 w-4 text-yellow-500" />
                                                        Buy Now
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
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


            </div>

            <Footer />
            <SeedButton />
        </div>
    );
}
