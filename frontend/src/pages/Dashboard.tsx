import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Scale, Clock, CheckCircle2, Package, ArrowRight, User as UserIcon, XCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { Order } from '../types/pawnshop';
import { PawnRequest } from '../lib/supabase';

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [pawns, setPawns] = useState<PawnRequest[]>([]);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch Orders
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*, items:order_items(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (ordersData) setOrders(ordersData);

                // Fetch Pawn Requests
                const { data: pawnData } = await supabase
                    .from('pawn_requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (pawnData) setPawns(pawnData);
            }
            setLoading(false);
        };

        fetchUserData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': case 'approved': return 'text-green-600 bg-green-50 border-green-100';
            case 'shipped': case 'processing': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'rejected': case 'cancelled': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );

    if (!user) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                <div className="bg-purple-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserIcon className="h-10 w-10 text-purple-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-500 mb-8">Please sign in to view your account dashboard and track your orders.</p>
                <a href="/login" className="block w-full bg-purple-600 text-white py-4 rounded-2xl font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-100">
                    Sign In Now
                </a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Profile Summary */}
            <div className="bg-purple-800 text-white pt-12 pb-24">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/10 overflow-hidden shadow-2xl">
                            <span className="text-3xl font-bold">{user.email?.[0].toUpperCase()}</span>
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-black mb-1">Welcome back!</h1>
                            <p className="text-purple-200 font-medium">{user.email}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                    <ShoppingBag className="h-4 w-4" />
                                    <span className="text-sm font-bold">{orders.length} Orders</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                    <Scale className="h-4 w-4" />
                                    <span className="text-sm font-bold">{pawns.length} Active Pawns</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="container mx-auto px-4 -mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Recent Orders */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <Package className="h-6 w-6 text-purple-600" /> Recent Orders
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {orders.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                                    <p className="text-gray-400 font-medium">No orders found.</p>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{order.id} • {new Date(order.created_at).toLocaleDateString()}</p>
                                                <h3 className="font-bold text-gray-900 mt-1">
                                                    {order.items?.map(i => i.product_name).join(', ')}
                                                </h3>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                            <span className="text-sm text-gray-500 font-medium">Order Total</span>
                                            <span className="text-lg font-black text-purple-700">₹{order.total_amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Active Pawns */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <Scale className="h-6 w-6 text-purple-600" /> My Pawn Requests
                            </h2>
                            <a href="/pawn" className="text-purple-600 font-bold text-sm hover:underline flex items-center gap-1">
                                New Request <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>

                        <div className="space-y-4">
                            {pawns.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                                    <p className="text-gray-400 font-medium">No pawn requests found.</p>
                                </div>
                            ) : (
                                pawns.map(pawn => (
                                    <div key={pawn.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{pawn.id.slice(0, 8)}... • {new Date(pawn.created_at).toLocaleDateString()}</p>
                                                <h3 className="font-bold text-gray-900 mt-1">{pawn.item_description}</h3>
                                            </div>
                                            <div className={`p-2 rounded-full ${pawn.status === 'approved' ? 'bg-green-100 text-green-600' : pawn.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {pawn.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : pawn.status === 'rejected' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Requested</p>
                                                <p className="text-lg font-black text-gray-900">₹{pawn.requested_amount.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Status</p>
                                                <p className={`text-sm font-bold capitalize ${pawn.status === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>{pawn.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
