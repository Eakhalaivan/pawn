import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Footer from '../components/Footer';
import { Bell, CheckCircle, Clock, DollarSign, RefreshCw } from 'lucide-react';

interface Notification {
    id: string;
    notification_type: string;
    title: string;
    message: string;
    pledge_id: string | null;
    interest_amount: number | null;
    total_amount: number | null;
    is_read: boolean;
    sent_via_email: boolean;
    created_at: string;
}

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // Set up real-time subscription for new notifications
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get customer_id from profiles or customers table
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!profile) return;

            const subscription = supabase
                .channel('notifications_changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `customer_id=eq.${profile.id}`
                    },
                    () => {
                        console.log('New notification received');
                        fetchNotifications();
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        };

        setupSubscription();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get customer record
            const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!customer) {
                setNotifications([]);
                return;
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('customer_id', customer.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds);

            if (error) throw error;

            // Update local state
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'monthly_interest':
                return <DollarSign className="h-6 w-6 text-purple-600" />;
            case 'payment_reminder':
                return <Clock className="h-6 w-6 text-yellow-600" />;
            case 'pledge_status':
                return <CheckCircle className="h-6 w-6 text-green-600" />;
            default:
                return <Bell className="h-6 w-6 text-blue-600" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'monthly_interest':
                return 'bg-purple-50 border-purple-200';
            case 'payment_reminder':
                return 'bg-yellow-50 border-yellow-200';
            case 'pledge_status':
                return 'bg-green-50 border-green-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8 px-4">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
                            <p className="text-gray-600">
                                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                    Mark all as read
                                </button>
                            )}
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p className="mt-4 text-gray-600">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications yet</h3>
                        <p className="text-gray-500">You'll see notifications about your pledges here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`bg-white border rounded-lg shadow-sm transition-all ${notification.is_read ? 'opacity-75' : ''
                                    } ${getNotificationColor(notification.notification_type)}`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.notification_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        {notification.title}
                                                        {!notification.is_read && (
                                                            <span className="ml-2 inline-block w-2 h-2 bg-purple-600 rounded-full"></span>
                                                        )}
                                                    </h3>
                                                    <p className="text-gray-700 mb-3">{notification.message}</p>

                                                    {notification.interest_amount !== null && notification.total_amount !== null && (
                                                        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-white rounded-lg border border-gray-200">
                                                            <div>
                                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Interest Amount</p>
                                                                <p className="text-xl font-bold text-purple-600">
                                                                    ₹{notification.interest_amount.toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Amount Due</p>
                                                                <p className="text-xl font-bold text-gray-900">
                                                                    ₹{notification.total_amount.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0 text-right">
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(notification.created_at).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(notification.created_at).toLocaleTimeString()}
                                                    </p>
                                                    {notification.sent_via_email && (
                                                        <p className="text-xs text-green-600 mt-1">✓ Emailed</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Notifications;
