import React, { useState } from 'react';
import { FileText, Plus, DollarSign, XCircle } from 'lucide-react';
import PledgeEntryForm from './PledgeEntryForm';
import PartPaymentForm from './PartPaymentForm';
import PledgeReturnForm from './PledgeReturnForm';
import AdditionalPledgeForm from './AdditionalPledgeForm';
import PledgeSalesForm from './PledgeSalesForm';
import CancelTransactionForm from './CancelTransactionForm';

type TransactionTab = 'pledge_entry' | 'additional_pledge' | 'pledge_return' | 'part_payment' | 'pledge_sales' | 'cancel';

import { PawnRequest } from '../../lib/supabase';

interface TransactionSectionProps {
    initialPawnRequest?: PawnRequest | null;
}

const TransactionSection: React.FC<TransactionSectionProps> = ({ initialPawnRequest }) => {
    const [activeTab, setActiveTab] = useState<TransactionTab>('pledge_entry');
    const [refreshKey, setRefreshKey] = useState(0);

    const tabs = [
        { id: 'pledge_entry' as TransactionTab, label: 'Pledge Entry', icon: Plus },
        { id: 'additional_pledge' as TransactionTab, label: 'Additional Pledge', icon: FileText },
        { id: 'pledge_return' as TransactionTab, label: 'Pledge Return', icon: DollarSign },
        { id: 'part_payment' as TransactionTab, label: 'Part Payment', icon: DollarSign },
        { id: 'pledge_sales' as TransactionTab, label: 'Pledge Sales', icon: FileText },
        { id: 'cancel' as TransactionTab, label: 'Cancel Transaction', icon: XCircle },
    ];

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Transaction Management</h2>

            {/* Sub Tabs */}
            <div className="bg-white rounded-lg shadow-md p-2">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-md p-6">
                {activeTab === 'pledge_entry' && (
                    <PledgeEntryForm
                        key={refreshKey}
                        onSuccess={handleSuccess}
                        initialPawnRequest={initialPawnRequest}
                    />
                )}

                {activeTab === 'additional_pledge' && (
                    <AdditionalPledgeForm
                        key={`additional-${refreshKey}`}
                        onSuccess={handleSuccess}
                    />
                )}

                {activeTab === 'pledge_return' && (
                    <PledgeReturnForm
                        key={`return-${refreshKey}`}
                        onSuccess={handleSuccess}
                    />
                )}

                {activeTab === 'part_payment' && (
                    <PartPaymentForm
                        key={`partpayment-${refreshKey}`}
                        onSuccess={handleSuccess}
                    />
                )}

                {activeTab === 'pledge_sales' && (
                    <PledgeSalesForm
                        key={`sales-${refreshKey}`}
                        onSuccess={handleSuccess}
                    />
                )}

                {activeTab === 'cancel' && (
                    <CancelTransactionForm
                        key={`cancel-${refreshKey}`}
                        onSuccess={handleSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default TransactionSection;
