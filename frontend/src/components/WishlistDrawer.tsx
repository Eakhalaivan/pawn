import React from 'react';
import { X, Heart, ShoppingCart, Trash2, Gem } from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useRates } from '../context/RateContext';

interface WishlistDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: JewelryItem[];
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ isOpen, onClose, items }) => {
    const { wishlist, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { calculateProductPrice } = useRates();

    const wishlistItems = items.filter(item => wishlist.includes(item.id));

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-red-500">
                            <Heart className="h-6 w-6 fill-current" />
                            Your Wishlist
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {wishlistItems.length === 0 ? (
                            <div className="text-center py-20">
                                <Heart className="h-20 w-20 text-gray-100 mx-auto mb-6" />
                                <p className="text-gray-500 font-medium">Your wishlist is empty.</p>
                                <button
                                    onClick={onClose}
                                    className="mt-4 text-purple-600 font-bold hover:underline"
                                >
                                    Browse Jewelry
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {wishlistItems.map((item) => {
                                    const price = calculateProductPrice(item.weight, item.metal_type, item.wastage_percent, item.price, item.name).totalPrice;
                                    return (
                                        <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                                            <div className="h-20 w-20 bg-white rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Gem className="h-10 w-10 text-gray-300 m-auto mt-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                                                        <button
                                                            onClick={() => toggleWishlist(item.id)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{item.category}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="font-black text-purple-700">{formatPrice(price)}</span>
                                                    <button
                                                        onClick={() => {
                                                            addToCart(item.id, item.weight);
                                                            toggleWishlist(item.id);
                                                        }}
                                                        className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm"
                                                    >
                                                        <ShoppingCart className="h-3.5 w-3.5" />
                                                        Add to Cart
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
