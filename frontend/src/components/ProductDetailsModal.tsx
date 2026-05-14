import React, { useState, useEffect } from 'react';
import { X, Scale, Info, ShoppingCart, Heart } from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { useRates } from '../context/RateContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductDetailsModalProps {
    item: JewelryItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ item, isOpen, onClose }) => {
    const { calculateProductPrice } = useRates();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [selectedWeight, setSelectedWeight] = useState<number>(0);
    const [customWeight, setCustomWeight] = useState<string>('');
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        if (item) {
            setSelectedWeight(item.weight);
            setCustomWeight(item.weight.toString());
            setIsCustom(false);
        }
    }, [item]);

    if (!item || !isOpen) return null;

    const currentWeight = isCustom ? (parseFloat(customWeight) || 0) : selectedWeight;
    const breakDown = calculateProductPrice(currentWeight, item.metal_type, item.wastage_percent, item.price, item.name);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    const handleWeightChange = (w: number) => {
        setSelectedWeight(w);
        setIsCustom(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center overflow-hidden h-64 md:h-auto">
                    {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" />
                    ) : (
                        <div className="text-gray-400">No Image</div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 px-2 py-1 bg-purple-50 rounded mb-2 inline-block">
                                {item.category} • {item.metal_type}
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{item.name}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => item && toggleWishlist(item.id)}
                                className={`p-2 rounded-full transition-colors ${item && isInWishlist(item.id)
                                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                    : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
                                    }`}
                                title={item && isInWishlist(item.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                                <Heart className={`h-6 w-6 ${item && isInWishlist(item.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <p className="text-gray-600 mb-6">{item.description}</p>

                    {/* Weight Selection (only for metal items) */}
                    {item.metal_type !== 'none' && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Scale className="h-4 w-4" />
                                {item.metal_type === 'diamond' ? 'Select Carats' : 'Select Weight (Grams)'}
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(item.metal_type === 'diamond'
                                    ? [0.1, 0.2, 0.3, 0.5, 1.0, 2.0, 3.0]
                                    : item.metal_type === 'silver'
                                        ? [1, 2, 3, 5, 10, 20, 50, 100]
                                        : [1, 2, 3, 5, 8, 10, 20]
                                ).map(w => (
                                    <button
                                        key={w}
                                        onClick={() => handleWeightChange(w)}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all font-semibold ${!isCustom && selectedWeight === w
                                            ? 'border-purple-600 bg-purple-50 text-purple-600 shadow-sm'
                                            : 'border-gray-200 hover:border-purple-300 text-gray-600'
                                            }`}
                                    >
                                        {w}{item.metal_type === 'diamond' ? 'ct' : 'g'}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setIsCustom(true)}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all font-semibold ${isCustom
                                        ? 'border-purple-600 bg-purple-50 text-purple-600'
                                        : 'border-gray-200 hover:border-purple-300 text-gray-600'
                                        }`}
                                >
                                    Custom
                                </button>
                            </div>

                            {isCustom && (
                                <input
                                    type="number"
                                    value={customWeight}
                                    onChange={(e) => setCustomWeight(e.target.value)}
                                    placeholder={item.metal_type === 'diamond' ? 'Enter carats' : 'Enter weight in grams'}
                                    className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                                />
                            )}
                        </div>
                    )}

                    {/* Tax & Breakdown Card */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Info className="h-4 w-4" /> Price Breakdown
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>{item.metal_type === 'diamond' ? 'Diamond Value' : 'Metal Value'} ({currentWeight}{item.metal_type === 'diamond' ? 'ct' : 'g'})</span>
                                <span>{formatCurrency(breakDown.basePrice)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Wastage ({item.wastage_percent}%)</span>
                                <span>{formatCurrency(breakDown.wastageAmount)}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex justify-between text-gray-500 italic">
                                <span>CGST (1.5%)</span>
                                <span>{formatCurrency(breakDown.cgst)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 italic">
                                <span>SGST (1.5%)</span>
                                <span>{formatCurrency(breakDown.sgst)}</span>
                            </div>
                            <div className="pt-3 border-t-2 border-dashed border-gray-300 flex justify-between text-xl font-black text-purple-700">
                                <span>Total Amount</span>
                                <span>{formatCurrency(breakDown.totalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Add to Cart */}
                    <button
                        onClick={() => {
                            addToCart(item.id, currentWeight);
                            onClose();
                        }}
                        className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-3 active:scale-95"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart - {formatCurrency(breakDown.totalPrice)}
                    </button>
                </div>
            </div>
        </div >
    );
};
