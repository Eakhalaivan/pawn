import api from '../lib/api';
import type { Pledge, PledgeFormData } from '../types/pawnshop';

// ============================================
// PLEDGES
// ============================================

export const getPledges = async (status?: string): Promise<Pledge[]> => {
    const response = await api.get('/pledges', {
        params: { status }
    });
    return response.data.data || [];
};

export const getPledgeById = async (id: string): Promise<Pledge> => {
    if (!id) {
        throw new Error('Pledge ID is required');
    }
    const response = await api.get(`/pledges/${id}`);
    return response.data.data;
};

export const createPledge = async (pledgeData: PledgeFormData): Promise<Pledge> => {
    // Map frontend camelCase/snake_case to backend expectations if necessary
    // Our backend expects customerId, schemeId, etc.
    const payload = {
        customerId: pledgeData.customer_id,
        schemeId: pledgeData.scheme_id,
        loanTypeId: pledgeData.loan_type_id,
        loanAmount: pledgeData.loan_amount,
        documentCharges: pledgeData.document_charges || 0,
        notes: pledgeData.notes,
        items: pledgeData.items.map(item => ({
            jewelleryTypeId: item.jewellery_type_id,
            itemDescription: item.item_description,
            grossWeightGrams: item.gross_weight_grams,
            netWeightGrams: item.net_weight_grams,
            purity: item.purity,
            quantity: item.quantity,
            itemValue: item.item_value
        }))
    };

    const response = await api.post('/pledges', payload);
    return response.data.data;
};

export const getPledgeInterest = async (id: string) => {
    const response = await api.get(`/pledges/${id}/interest`);
    return response.data.data;
};
