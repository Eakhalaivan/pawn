import React, { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import { PawnRequest } from '../lib/supabase';
import Footer from '../components/Footer';
import { Calculator, Scale, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const Pawn: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(5);
  const [time, setTime] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'months' | 'years'>('years');
  const [amount, setAmount] = useState<number>(0);
  const [interest, setInterest] = useState<number>(0);

  // Pawn request form state
  const [itemDescription, setItemDescription] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // User's pawn requests
  const [pawnRequests, setPawnRequests] = useState<PawnRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    fetchPawnRequests();

    // Set up real-time subscription for pawn requests
    let subscription: any;
    let pollInterval: NodeJS.Timeout;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found, skipping subscription');
        return;
      }

      console.log('✅ Setting up real-time subscription for user:', user.id);

      subscription = supabase
        .channel('pawn_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pawn_requests',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 Pawn request updated:', payload);
            // Refresh the list when any change occurs
            fetchPawnRequests();
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
        });
    };

    setupSubscription();

    // Auto-refresh every 10 seconds as backup (in case real-time fails)
    pollInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing pawn requests...');
      fetchPawnRequests();
    }, 10000); // 10 seconds

    // Cleanup subscription and interval on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const fetchPawnRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pawn_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPawnRequests(data || []);
    } catch (error) {
      console.error('Error fetching pawn requests from Supabase, using empty array:', error);
      // Use empty array as fallback when Supabase is not available
      setPawnRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const calculateInterest = () => {
    // Treat 'rate' as Monthly Interest Rate
    const timeInMonths = durationUnit === 'years' ? time * 12 : time;
    const totalInterest = principal * (rate / 100) * timeInMonths;
    const finalAmount = principal + totalInterest;

    setAmount(finalAmount);
    setInterest(totalInterest);
  };

  const handlePawnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to submit a pawn request');
        return;
      }

      const { error: insertError } = await supabase
        .from('pawn_requests')
        .insert({
          user_id: user.id,
          item_description: itemDescription,
          requested_amount: parseFloat(requestedAmount),
          status: 'pending'
        });

      if (insertError) throw insertError;

      setSuccess('Pawn request submitted successfully! We will review it shortly.');
      setItemDescription('');
      setRequestedAmount('');
      fetchPawnRequests();
    } catch (error: any) {
      console.error('Pawn request submission error:', error);
      if (error.message?.includes('fetch failed') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        setError('Database connection unavailable. Please try again later or contact support.');
      } else {
        setError(error.message || 'Failed to submit pawn request');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Pawn Services</h1>
          <p className="text-gray-600">Get quick loans against your valuable items with competitive rates</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Interest Calculator */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-6">
              <Calculator className="h-8 w-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Interest Calculator</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Principal Amount (₹)
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Interest Rate (%)
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as 'months' | 'years')}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <button
                onClick={calculateInterest}
                className="w-full bg-purple-600 text-white font-medium py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
              >
                Calculate
              </button>

              {amount > 0 && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 bg-white rounded shadow-sm">
                      <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
                      <p className="text-lg font-bold text-purple-900">₹{amount.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded shadow-sm">
                      <p className="text-xs text-gray-500 uppercase font-bold">Total Interest</p>
                      <p className="text-lg font-bold text-purple-700">₹{interest.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded shadow-sm">
                      <p className="text-xs text-gray-500 uppercase font-bold">Interest %</p>
                      <p className="text-lg font-bold text-purple-600">{((interest / principal) * 100).toFixed(1)}%</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded shadow-sm">
                      <p className="text-xs text-gray-500 uppercase font-bold">Total Months</p>
                      <p className="text-lg font-bold text-purple-600">
                        {durationUnit === 'years' ? time * 12 : time}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {amount > 0 && (
                <div className="mt-6 overflow-hidden border border-gray-100 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 italic">
                      {[...Array(Math.min(durationUnit === 'years' ? time * 12 : time, 12))].map((_, i) => {
                        const month = i + 1;
                        const monthlyInterest = principal * (rate / 100);
                        const accumInterest = monthlyInterest * month;
                        return (
                          <tr key={i}>
                            <td className="px-3 py-2 text-sm text-gray-600 font-medium">Month {month}</td>
                            <td className="px-3 py-2 text-sm text-purple-600">₹{accumInterest.toFixed(0)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 font-bold">₹{(principal + accumInterest).toFixed(0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {(durationUnit === 'years' ? time * 12 : time) > 12 && <p className="p-2 text-xs text-center text-gray-400">Showing first 12 months...</p>}
                </div>
              )}
            </div>
          </div>

          {/* Pawn Request Form */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-6">
              <Scale className="h-8 w-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Submit Pawn Request</h2>
            </div>

            <form onSubmit={handlePawnRequest} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Description
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Describe your jewelry item (type, material, weight, condition, etc.)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Amount (₹)
                </label>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  step="0.01"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter amount you'd like to borrow"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white font-medium py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Pawn Requests History */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Your Pawn Requests</h2>
            </div>
            <button
              onClick={() => {
                setRequestsLoading(true);
                fetchPawnRequests();
              }}
              disabled={requestsLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh requests"
            >
              <RefreshCw className={`h-4 w-4 ${requestsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {requestsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading your pawn requests...</p>
            </div>
          ) : pawnRequests.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pawn requests yet. Submit your first request above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pawnRequests.map((request) => (
                <div key={request.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">{request.item_description}</p>
                      <p className="text-2xl font-bold text-purple-600 mb-2">
                        ₹{request.requested_amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(request.status)}
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pawn;
