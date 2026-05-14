import React from 'react';
import { X, ShoppingBag, Gem, Scale } from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { CartItem } from '../context/CartContext';
import { useRates } from '../context/RateContext';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: { [key: string]: CartItem };
    items: JewelryItem[];
    updateCart: (cartId: string, quantity: number) => void;
    onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen,
    onClose,
    cart,
    items,
    updateCart,
    onCheckout,
}) => {
    const { calculateProductPrice } = useRates();

    const cartItems = Object.values(cart).map(cartItem => {
        const product = items.find(p => p.id === cartItem.productId);
        if (!product) return null;

        const priceDetails = calculateProductPrice(cartItem.weight, product.metal_type, product.wastage_percent, product.price, product.name);

        return {
            ...product,
            cartId: cartItem.id,
            selectedWeight: cartItem.weight,
            quantity: cartItem.quantity,
            calculatedPrice: priceDetails.totalPrice
        };
    }).filter(Boolean) as (JewelryItem & { cartId: string, selectedWeight: number, quantity: number, calculatedPrice: number })[];

    const total = cartItems.reduce((sum, item) => sum + (item.calculatedPrice * item.quantity), 0);

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
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingBag className="h-6 w-6 text-purple-600" />
                            Your Shopping Cart
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {cartItems.length === 0 ? (
                            <div className="text-center py-20">
                                <ShoppingBag className="h-20 w-20 text-gray-100 mx-auto mb-6" />
                                <p className="text-gray-500 font-medium">Your cart is feeling a bit light...</p>
                                <button
                                    onClick={onClose}
                                    className="mt-4 text-purple-600 font-bold hover:underline"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {cartItems.map((item) => (
                                    <div key={item.cartId} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                        <div className="h-20 w-20 bg-white rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Gem className="h-10 w-10 text-gray-300 m-auto mt-5" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                                    <span>{item.category}</span>
                                                    {item.metal_type !== 'none' && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Scale className="h-3 w-3" /> {item.selectedWeight}{item.metal_type === 'diamond' ? 'ct' : 'g'}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="font-black text-purple-700">{formatPrice(item.calculatedPrice)}</span>
                                                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200">
                                                    <button
                                                        onClick={() => updateCart(item.cartId, item.quantity - 1)}
                                                        className="p-1 hover:text-purple-600 transition-colors"
                                                    >
                                                        <MinusIcon />
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateCart(item.cartId, item.quantity + 1)}
                                                        className="p-1 hover:text-purple-600 transition-colors"
                                                    >
                                                        <PlusIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {cartItems.length > 0 && (
                        <div className="border-t border-gray-100 p-6 space-y-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
                            <div className="space-y-2">
                                <div className="flex justify-between text-gray-500 text-sm">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-black text-gray-900">
                                    <span>Estimated Total</span>
                                    <span className="text-purple-700">{formatPrice(total)}</span>
                                </div>
                            </div>
                            <button
                                onClick={onCheckout}
                                className="w-full bg-purple-700 text-white py-4 rounded-2xl font-black text-lg hover:bg-purple-800 transition-all shadow-xl shadow-purple-100 active:scale-[0.98]"
                            >
                                Proceed to Checkout
                            </button>
                            <p className="text-[10px] text-center text-gray-400 font-medium">Prices subject to real-time market changes until purchase.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const MinusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
    </svg>
);
