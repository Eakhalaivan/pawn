import React from 'react';
import { ShieldCheck, Award, Truck, CreditCard } from 'lucide-react';

export const TrustBadges: React.FC = () => {
    const badges = [
        {
            icon: <Award className="h-8 w-8 text-yellow-600" />,
            title: "BIS Hallmarked",
            description: "100% Purity Guaranteed"
        },
        {
            icon: <ShieldCheck className="h-8 w-8 text-blue-600" />,
            title: "GIA Certified",
            description: "Genuine Gemstones"
        },
        {
            icon: <CreditCard className="h-8 w-8 text-purple-600" />,
            title: "Secure Payment",
            description: "Encrypted Transactions"
        },
        {
            icon: <Truck className="h-8 w-8 text-green-600" />,
            title: "Insured Shipping",
            description: "Safe & Fast Delivery"
        }
    ];

    return (
        <div className="bg-white py-12 border-y border-gray-100">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {badges.map((badge, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center group transition-transform hover:-translate-y-1">
                            <div className="mb-4 p-4 bg-gray-50 rounded-2xl group-hover:bg-white group-hover:shadow-xl transition-all duration-300">
                                {badge.icon}
                            </div>
                            <h3 className="font-black text-gray-900 mb-1">{badge.title}</h3>
                            <p className="text-xs text-gray-500 font-medium">{badge.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
