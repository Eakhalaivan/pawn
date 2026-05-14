import { supabase } from '../lib/supabase';
import type { Customer, CustomerFormData } from '../types/pawnshop';
import { handleApiError, logError } from '../utils/errorHandler';

// ============================================
// CUSTOMERS
// ============================================

export const getCustomers = async (searchTerm?: string): Promise<Customer[]> => {
    return handleApiError(async () => {
        let query = supabase
            .from('customers')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
            logError(error, 'getCustomers');
            throw error;
        }
        return data || [];
    });
};

export const getCustomerById = async (id: string): Promise<Customer> => {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const createCustomer = async (customer: CustomerFormData): Promise<Customer> => {
    return handleApiError(async () => {
        // Validate required fields
        if (!customer.full_name || !customer.phone || !customer.address) {
            throw new Error('Full name, phone, and address are required');
        }

        const { data, error } = await supabase
            .from('customers')
            .insert(customer)
            .select()
            .single();

        if (error) {
            logError(error, 'createCustomer');
            throw error;
        }
        return data;
    });
};

export const updateCustomer = async (id: string, customer: Partial<CustomerFormData>): Promise<void> => {
    const { error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id);

    if (error) throw error;
};
