import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, MapPin, Calendar, Save, Loader } from 'lucide-react';
import Footer from '../components/Footer';
import { toast } from '../utils/toast';

interface ProfileData {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    created_at: string;
}

const Profile: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = '/login';
                return;
            }

            // Determine table based on role
            const role = user.user_metadata?.role;
            const table = ['admin', 'manager', 'staff'].includes(role) ? 'app_users' : 'customers';

            // Fetch profile data
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Profile missing
                } else {
                    console.error('Error fetching profile:', error);
                }
            }

            if (data) {
                setProfile(data);
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    pincode: data.pincode || ''
                });
            } else {
                setFormData(prev => ({ ...prev, full_name: user.user_metadata?.full_name || '' }));
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const role = user.user_metadata?.role;
            const table = ['admin', 'manager', 'staff'].includes(role) ? 'app_users' : 'customers';

            // Prepare updates based on table schema
            let updates: any = {
                id: user.id,
                full_name: formData.full_name,
                phone: formData.phone,
                updated_at: new Date().toISOString(),
            };

            if (table === 'app_users') {
                // app_users only has address field
                updates.address = formData.address;
                // Append city/state/zip to address if needed, or just ignore for now as field isn't there
            } else {
                // customers has all fields
                updates.address = formData.address;
                updates.city = formData.city;
                updates.state = formData.state;
                updates.pincode = formData.pincode;
            }

            const { error } = await supabase
                .from(table)
                .upsert(updates);

            if (error) throw error;

            toast.success('Profile updated successfully');
            fetchProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-grow container mx-auto py-8 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-600">Manage your personal information</p>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="bg-purple-700 px-6 py-4">
                            <div className="flex items-center space-x-4">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-purple-700">
                                    {formData.full_name ? formData.full_name[0].toUpperCase() : <User />}
                                </div>
                                <div className="text-white">
                                    <h2 className="text-xl font-bold">{formData.full_name || 'User'}</h2>
                                    <p className="text-purple-200 flex items-center text-sm">
                                        <Mail className="h-4 w-4 mr-1" />
                                        {profile?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                                            <MapPin className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <textarea
                                            name="address"
                                            rows={3}
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                                            placeholder="123 Main St, Apartment 4B"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pincode
                                    </label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-75"
                                >
                                    {saving ? (
                                        'Saving...'
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Profile;
