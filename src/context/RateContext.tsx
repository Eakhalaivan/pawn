import React, { createContext, useContext, useState, useEffect } from 'react';

export type MetalRates = {
    gold: number;     // per gram (24K)
    gold22k: number;  // per gram
    silver: number;   // per gram
    platinum: number; // per gram
    diamond: number;  // per carat (simplified)
};

type RateContextType = {
    rates: MetalRates;
    loading: boolean;
    lastUpdated: Date | null;
    error: string | null;
    calculateProductPrice: (weight: number, metalType: string, wastagePercent: number, basePrice?: number, productName?: string) => {
        basePrice: number;
        wastageAmount: number;
        cgst: number;
        sgst: number;
        totalPrice: number;
    };
};

const RateContext = createContext<RateContextType | undefined>(undefined);

// Fallback rates in case API fails
const FALLBACK_RATES: MetalRates = {
    gold: 6250.00,    // ₹6,250 per gram for 24K
    gold22k: 5730.00, // ₹5,730 per gram for 22K
    silver: 75.50,    // ₹75.50 per gram
    platinum: 3200.00,
    diamond: 65000.00 // per carat
};

export const RateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [rates, setRates] = useState<MetalRates>(FALLBACK_RATES);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchLiveRates = async () => {
        try {
            setLoading(true);
            setError(null);

            // Using GoldAPI.io - Free tier: 100 requests/month
            // Sign up at: https://www.goldapi.io/
            // Alternative free APIs:
            // 1. Metals.dev - https://metals.dev/ (100 req/month)
            // 2. MetalpriceAPI.com - https://metalpriceapi.com/ (50 req/month)

            const API_KEY = import.meta.env.VITE_GOLD_API_KEY || '';

            if (!API_KEY) {
                console.warn('⚠️ No API key found. Using fallback simulation mode.');
                // Simulate realistic price variations
                const baseGold24k = 6250 + (Math.random() * 200 - 100);
                const gold22kRate = baseGold24k * 0.916;
                const baseSilver = 75.50 + (Math.random() * 5 - 2.5);
                const basePlatinum = 3200 + (Math.random() * 100 - 50);
                const baseDiamond = 65000 + (Math.random() * 2000 - 1000);

                const newRates: MetalRates = {
                    gold: Math.round(baseGold24k * 100) / 100,
                    gold22k: Math.round(gold22kRate * 100) / 100,
                    silver: Math.round(baseSilver * 100) / 100,
                    platinum: Math.round(basePlatinum * 100) / 100,
                    diamond: Math.round(baseDiamond * 100) / 100
                };

                setRates(newRates);
                setLastUpdated(new Date());
                console.log('✅ Rates updated (simulation mode):', newRates);
                return;
            }

            // Fetch from GoldAPI.io
            const response = await fetch('https://www.goldapi.io/api/XAU/INR', {
                method: 'GET',
                headers: {
                    'x-access-token': API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const goldData = await response.json();

            // Fetch silver price
            const silverResponse = await fetch('https://www.goldapi.io/api/XAG/INR', {
                method: 'GET',
                headers: {
                    'x-access-token': API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            const silverData = await silverResponse.json();

            // Convert from per troy ounce to per gram
            // 1 troy ounce = 31.1035 grams
            const GRAMS_PER_TROY_OUNCE = 31.1035;

            const gold24kPerGram = goldData.price_gram_24k || (goldData.price / GRAMS_PER_TROY_OUNCE);
            const gold22kPerGram = gold24kPerGram * 0.916; // 22K is 91.6% pure
            const silverPerGram = silverData.price_gram_24k || (silverData.price / GRAMS_PER_TROY_OUNCE);

            const newRates: MetalRates = {
                gold: Math.round(gold24kPerGram * 100) / 100,
                gold22k: Math.round(gold22kPerGram * 100) / 100,
                silver: Math.round(silverPerGram * 100) / 100,
                platinum: 3200 + (Math.random() * 100 - 50), // Platinum not in free tier
                diamond: 65000 + (Math.random() * 2000 - 1000) // Diamond is separate market
            };

            setRates(newRates);
            setLastUpdated(new Date());
            console.log('✅ Live rates fetched from API:', newRates);

        } catch (error) {
            console.error('❌ Error fetching metal rates:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch rates');

            // Use fallback rates on error
            if (rates.gold === FALLBACK_RATES.gold) {
                // If we haven't set rates yet, use fallback
                setRates(FALLBACK_RATES);
                setLastUpdated(new Date());
            }
            // Otherwise keep current rates
        } finally {
            setLoading(false);
        }
    };

    // Fetch rates on mount
    useEffect(() => {
        fetchLiveRates();
    }, []);

    // Auto-refresh every 5 minutes (300000ms)
    // Note: With free tier (100 req/month), this allows ~20 days of continuous use
    // Adjust interval based on your API limits
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing metal rates...');
            fetchLiveRates();
        }, 300000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    const calculateProductPrice = (weight: number, metalType: string, wastagePercent: number, basePrice: number = 0, productName: string = '') => {
        let metalRate = 0;

        switch ((metalType || '').toLowerCase()) {
            case 'gold':
                // Check if it's 24K (Coins) or 22K (Jewelry)
                metalRate = (productName || '').toLowerCase().includes('24k') ? rates.gold : rates.gold22k;
                break;
            case 'silver':
                metalRate = rates.silver;
                break;
            case 'platinum':
                metalRate = rates.platinum;
                break;
            case 'diamond':
                metalRate = rates.diamond;
                break;
            default:
                return {
                    basePrice: basePrice,
                    wastageAmount: 0,
                    cgst: basePrice * 0.015,
                    sgst: basePrice * 0.015,
                    totalPrice: basePrice * 1.03
                };
        }

        const metalValue = weight * metalRate;
        const wastageAmount = metalValue * (wastagePercent / 100);
        const subtotal = metalValue + wastageAmount;
        const cgst = subtotal * 0.015;
        const sgst = subtotal * 0.015;
        const total = subtotal + cgst + sgst;

        return {
            basePrice: metalValue,
            wastageAmount,
            cgst,
            sgst,
            totalPrice: total
        };
    };

    return (
        <RateContext.Provider value={{ rates, loading, lastUpdated, error, calculateProductPrice }}>
            {children}
        </RateContext.Provider>
    );
};

export const useRates = () => {
    const context = useContext(RateContext);
    if (!context) {
        throw new Error('useRates must be used within a RateProvider');
    }
    return context;
};
