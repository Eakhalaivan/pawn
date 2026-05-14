import React, { useState } from 'react';
import { X, Gem, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { PaymentGateway } from './PaymentGateway';
import { generateInvoice } from '../utils/invoiceUtils';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: {
        name: string;
        price: number;
        weight: number;
        unit: string;
        image_url?: string;
    }[];
    totalAmount: number;
    isCartCheckout?: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen,
    onClose,
    items,
    totalAmount,
    isCartCheckout = false,
}) => {
    const [step, setStep] = useState<'address' | 'payment'>('address');
    const { clearCart } = useCart();
    const [address, setAddress] = useState({
        fullName: '',
        street: '',
        city: '',
        zipCode: '',
        phone: ''
    });

    if (!isOpen) return null;

    const handleSuccess = async (paymentIntent: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // 1. Create Order
                const orderId = `ORD-${Date.now()}`;
                const { error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        id: orderId,
                        user_id: user.id,
                        total_amount: totalAmount,
                        status: 'processing',
                        shipping_address: address,
                        payment_intent_id: paymentIntent?.id || 'mock_payment_id'
                    });

                if (orderError) throw orderError;

                // 2. Create Order Items
                const orderItems = items.map(item => ({
                    order_id: orderId,
                    product_name: item.name,
                    price: item.price,
                    weight: item.weight,
                    unit: item.unit,
                    image_url: item.image_url,
                    quantity: 1 // Assuming 1 for flattened items list, or we need quantity in items prop
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems);

                if (itemsError) throw itemsError;
            }

            // Generate and download invoice
            generateInvoice(address.fullName, items.map(i => ({
                name: i.name,
                price: i.price,
                weight: i.weight,
                unit: i.unit
            })), totalAmount);

            if (isCartCheckout) {
                clearCart();
            }

            alert('Payment Successful! Your order has been placed and digital invoice downloaded.');
            onClose();
            setStep('address');
        } catch (error: any) {
            console.error('Order creation failed:', error);
            alert(`Payment successful but failed to create order: ${error.message}`);
        }
    };

    const handleError = (error: string) => {
        alert(`Payment Error: ${error}`);
    };

    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('payment');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                {/* Left Side: Steps & Form */}
                <div className="w-full md:w-3/5 p-8 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors md:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="flex items-center space-x-4 mb-8">
                        <div className={`flex items-center ${step === 'address' ? 'text-purple-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'address' ? 'border-purple-600 bg-purple-50' : 'border-gray-300'}`}>
                                <MapPin className="h-4 w-4" />
                            </div>
                            <span className="ml-2 font-bold text-sm">Shipping</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                        <div className={`flex items-center ${step === 'payment' ? 'text-purple-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'payment' ? 'border-purple-600 bg-purple-50' : 'border-gray-300'}`}>
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <span className="ml-2 font-bold text-sm">Payment</span>
                        </div>
                    </div>

                    {step === 'address' ? (
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Where should we send it?</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={address.fullName}
                                    onChange={e => setAddress({ ...address, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={address.street}
                                    onChange={e => setAddress({ ...address, street: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={address.city}
                                        onChange={e => setAddress({ ...address, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={address.zipCode}
                                        onChange={e => setAddress({ ...address, zipCode: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={address.phone}
                                    onChange={e => setAddress({ ...address, phone: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
                            >
                                Continue to Payment
                            </button>
                        </form>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Complete your order</h3>
                            <button
                                onClick={() => setStep('address')}
                                className="text-sm text-purple-600 font-medium hover:underline mb-4 flex items-center"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180" /> Back to Shipping
                            </button>
                            <PaymentGateway
                                amount={totalAmount}
                                onSuccess={handleSuccess}
                                onError={handleError}
                            />
                        </div>
                    )}
                </div>

                {/* Right Side: Order Summary */}
                <div className="w-full md:w-2/5 p-8 bg-gray-50 border-l border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors hidden md:block"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Order Detail</h4>
                    <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-white rounded-lg flex-shrink-0 overflow-hidden border">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Gem className="h-6 w-6 text-gray-400 m-auto mt-4" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                                    <p className="text-sm text-purple-600 font-semibold">
                                        {new Intl.NumberFormat('en-IN', {
                                            style: 'currency',
                                            currency: 'INR',
                                            maximumFractionDigits: 0
                                        }).format(item.price)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed pt-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Shipping</span>
                            <span className="text-green-600 font-medium">FREE</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-black text-gray-900 pt-4">
                            <span>Total</span>
                            <span className="text-purple-600">
                                {new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: 'INR',
                                    maximumFractionDigits: 0
                                }).format(totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
