import React from 'react';
import { useRates } from '../context/RateContext';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const LiveMetalRates: React.FC = () => {
    const { rates, loading, lastUpdated } = useRates();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(price);
    };

    const formatTime = (date: Date | null) => {
        if (!date) return 'Updating...';
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <motion.div
            className="bg-zinc-900 border-b border-yellow-900/30 overflow-x-auto shadow-md"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto px-4 py-3 flex items-center gap-6 whitespace-nowrap min-w-max">
                <motion.div
                    className="flex items-center gap-2"
                    animate={loading ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
                >
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                    <span className="text-xs font-bold uppercase text-yellow-500/80 tracking-widest">Live Rates</span>
                    {loading && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <RefreshCw className="h-3 w-3 text-yellow-500" />
                        </motion.div>
                    )}
                </motion.div>

                <div className="flex items-center gap-4 text-sm font-medium">
                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 rounded-full border border-yellow-500/30 shadow-sm"
                        whileHover={{ scale: 1.05, y: -2, borderColor: "rgba(234, 179, 8, 0.6)" }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <motion.div
                            className="w-2 h-2 rounded-full bg-yellow-500"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [1, 0.7, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-yellow-100/80 font-serif">Gold 24K:</span>
                        <motion.span
                            className="text-yellow-400 font-bold"
                            key={rates.gold}
                            initial={{ scale: 1.2, color: "#10b981" }}
                            animate={{ scale: 1, color: "#facc15" }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.gold)}
                        </motion.span>
                        <span className="text-[10px] text-yellow-500/60">/g</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-yellow-900/10 to-yellow-800/10 rounded-full border border-yellow-500/20 shadow-sm"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <span className="text-yellow-100/80 font-serif">Gold 22K:</span>
                        <motion.span
                            className="text-yellow-400 font-bold"
                            key={rates.gold22k}
                            initial={{ scale: 1.2, color: "#10b981" }}
                            animate={{ scale: 1, color: "#facc15" }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.gold22k)}
                        </motion.span>
                        <span className="text-[10px] text-yellow-500/60">/g</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-700 shadow-sm"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <span className="text-zinc-300 font-serif">Silver:</span>
                        <motion.span
                            className="text-white font-bold"
                            key={rates.silver}
                            initial={{ scale: 1.2, color: "#10b981" }}
                            animate={{ scale: 1, color: "#ffffff" }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.silver)}
                        </motion.span>
                        <span className="text-[10px] text-zinc-500">/g</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-700 shadow-sm"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <span className="text-zinc-300 font-serif">Platinum:</span>
                        <motion.span
                            className="text-white font-bold"
                            key={rates.platinum}
                            initial={{ scale: 1.2, color: "#10b981" }}
                            animate={{ scale: 1, color: "#ffffff" }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.platinum)}
                        </motion.span>
                        <span className="text-[10px] text-zinc-500">/g</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-700 shadow-sm"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <span className="text-zinc-300 font-serif">Diamond:</span>
                        <motion.span
                            className="text-white font-bold"
                            key={rates.diamond}
                            initial={{ scale: 1.2, color: "#10b981" }}
                            animate={{ scale: 1, color: "#ffffff" }}
                            transition={{ duration: 0.5 }}
                        >
                            {formatPrice(rates.diamond)}
                        </motion.span>
                        <span className="text-[10px] text-zinc-500">/ct</span>
                    </motion.div>
                </div>

                {/* Last Updated Indicator */}
                {lastUpdated && (
                    <motion.div
                        className="ml-auto flex items-center gap-2 text-xs text-yellow-500/60 bg-black/20 px-3 py-1.5 rounded-full border border-yellow-900/20"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span className="font-serif">Updated:</span>
                        <span className="font-bold text-yellow-500">{formatTime(lastUpdated)}</span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default LiveMetalRates;
