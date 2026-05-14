// ============================================
// PAWNSHOP MANAGEMENT SYSTEM - TYPE DEFINITIONS
// ============================================

// Master Data Types
export interface MetalRate {
    id: string;
    metal_type: 'gold' | 'silver';
    rate_per_gram: number;
    effective_date: string;
    created_at: string;
    updated_at: string;
}

export interface Company {
    id: string;
    company_name: string;
    branch_name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    gst_number?: string;
    license_number?: string;
    logo_url?: string;
    print_header?: string;
    print_footer?: string;
    language_preference: 'en' | 'ta' | 'hi';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoanType {
    id: string;
    loan_type_name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface JewelleryType {
    id: string;
    jewellery_type_name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Scheme {
    id: string;
    scheme_name: string;
    interest_rate: number;
    interest_type: 'monthly' | 'annual' | 'daily';
    min_amount?: number;
    max_amount?: number;
    redemption_period_days: number;
    penalty_rate: number;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BankMaster {
    id: string;
    bank_name: string;
    branch_name?: string;
    account_number?: string;
    ifsc_code?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AppUser {
    id: string;
    username: string;
    password_hash: string;
    full_name?: string;
    role: 'admin' | 'manager' | 'staff';
    email?: string;
    phone?: string;
    // Enhanced fields
    designation?: string;
    qualification?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    id_proof_type?: string;
    id_proof_number?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    photo_url?: string;
    is_blocked?: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Customer Types
export interface Customer {
    id: string;
    customer_code: string;
    full_name: string;
    father_name?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    phone: string;
    alternate_phone?: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    id_proof_type?: 'aadhar' | 'pan' | 'voter_id' | 'passport' | 'driving_license';
    id_proof_number?: string;
    photo_url?: string;
    // Nominee Details
    nominee_name?: string;
    nominee_relation?: string;
    nominee_contact?: string;
    nominee_id_proof?: string;
    username?: string;
    password_hash?: string;
    is_active: boolean;
    is_blocked?: boolean;
    block_reason?: string;
    created_at: string;
    updated_at: string;
}

export interface CustomerDocument {
    id: string;
    customer_id: string;
    document_type: string;
    document_url: string;
    uploaded_at: string;
}

// Transaction Types
export interface Pledge {
    id: string;
    pledge_number: string;
    customer_id: string;
    company_id?: string;
    loan_type_id?: string;
    scheme_id?: string;
    pledge_date: string;
    total_weight_grams: number;
    total_items: number;
    appraised_value: number;
    loan_amount: number;
    interest_rate: number;
    interest_type: 'monthly' | 'annual' | 'daily';
    redemption_date?: string;
    status: 'active' | 'partially_paid' | 'closed' | 'sold' | 'bank_pledged';
    document_charges?: number; // Added Phase 2
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface PledgeItem {
    id: string;
    pledge_id: string;
    jewellery_type_id?: string;
    item_description: string;
    gross_weight_grams: number;
    net_weight_grams: number;
    purity?: string;
    quantity: number;
    item_value?: number;
    photo_url?: string;
    purity_test_value?: string;
    created_at: string;
}

export interface AdditionalPledge {
    id: string;
    original_pledge_id: string;
    additional_date: string;
    additional_weight_grams: number;
    additional_amount: number;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface PartPayment {
    id: string;
    pledge_id: string;
    payment_date: string;
    payment_amount: number;
    principal_paid: number;
    interest_paid: number;
    payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer';
    receipt_number?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface PledgeReturn {
    id: string;
    pledge_id: string;
    return_date: string;
    principal_amount: number;
    interest_amount: number;
    penalty_amount: number;
    total_amount: number;
    payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer';
    receipt_number?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface PledgeSale {
    id: string;
    pledge_id: string;
    sale_date: string;
    sale_amount: number;
    buyer_name?: string;
    buyer_phone?: string;
    payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer';
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface CancelledTransaction {
    id: string;
    transaction_type: string;
    transaction_id: string;
    cancellation_date: string;
    reason: string;
    cancelled_by?: string;
    created_at: string;
}

// Bank Operations Types
export interface BankPledge {
    id: string;
    pledge_id: string;
    bank_id: string;
    sent_date: string;
    amount_received: number;
    bank_interest_rate?: number;
    expected_return_date?: string;
    status: 'sent' | 'received' | 'settled';
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface BankPledgeReceive {
    id: string;
    bank_pledge_id: string;
    received_date: string;
    amount_paid: number;
    interest_paid: number;
    notes?: string;
    created_by?: string;
    created_at: string;
}

// Accounts Types
export interface CashTransaction {
    id: string;
    transaction_date: string;
    transaction_type: 'cash_in' | 'cash_out';
    amount: number;
    category: string;
    reference_type?: string;
    reference_id?: string;
    description?: string;
    payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer';
    created_by?: string;
    created_at: string;
}

// Extended Types with Relations
export interface PledgeWithDetails extends Pledge {
    customer?: Customer;
    company?: Company;
    loan_type?: LoanType;
    scheme?: Scheme;
    items?: PledgeItem[];
    part_payments?: PartPayment[];
}

export interface CustomerWithPledges extends Customer {
    pledges?: Pledge[];
    total_active_pledges?: number;
    total_loan_amount?: number;
}

// Dashboard Types
export interface DashboardStats {
    total_active_pledges: number;
    total_loan_amount: number;
    total_customers: number;
    today_pledges: number;
    today_returns: number;
    cash_in_hand: number;
    gold_rate: number;
    silver_rate: number;
}

// Form Types
export interface PledgeFormData {
    customer_id: string;
    company_id?: string;
    loan_type_id?: string;
    scheme_id?: string;
    pledge_date: string;
    loan_amount: number;
    interest_rate: number;
    interest_type: 'monthly' | 'annual' | 'daily';
    document_charges?: number;
    pledge_number?: string; // New: Custom bill number
    notes?: string;
    items: PledgeItemFormData[];
}

export interface PledgeItemFormData {
    jewellery_type_id?: string;
    item_description: string;
    gross_weight_grams: number;
    net_weight_grams: number;
    purity?: string;
    quantity: number;
    item_value?: number;
    photo_url?: string;
    purity_test_value?: string;
}

export interface CustomerFormData {
    full_name: string;
    father_name?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    phone: string;
    alternate_phone?: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    id_proof_type?: 'aadhar' | 'pan' | 'voter_id' | 'passport' | 'driving_license';
    id_proof_number?: string;
    photo_url?: string;
    nominee_name?: string;
    nominee_relation?: string;
    nominee_contact?: string;
    nominee_id_proof?: string;
    username?: string;
    password?: string;
}

// Report Types
export interface DayBookRow {
    date: string;
    particulars: string;
    credit: number;
    debit: number;
    balance: number;
}

export interface InterestPendingRow {
    bill_no: string;
    date: string;
    customer_name: string;
    mobile: string;
    interest_rate: number;
    months_due: number;
    net_weight: string;
    loan_amount: number;
    interest_amount: string;
    total_due: string;
}

export interface InterestCollectionRow {
    bill_no: string;
    date: string;
    customer_name: string;
    interest_collected: number;
    type: 'Part Payment' | 'Final Settlement';
}

export interface CustomerPledgeReportRow {
    bill_no: string;
    date: string;
    customer_name: string;
    mobile: string;
    net_weight: string | number;
    amount: number; // Loan Amount
    status: string;
    type: string; // New, In Bank, Active, etc.
}

export interface PledgeReturnRow {
    bill_no: string;
    return_date: string;
    customer_name: string;
    mobile: string;
    net_weight: string;
    loan_amount: number;
    received_amount: number;
    status: string;
}

export interface BankPledgeRow {
    // Defines structure for bank pledge report
    bank_name: string;
    pledge_number: string;
    loan_amount: number;
    amount_received: number;
    sent_date: string;
    status: string;
}

export interface PledgeSaleRow {
    pledge_number: string;
    loan_amount: number;
    sale_amount: number;
    sale_date: string;
    buyer_name: string;
}

export interface DetailReportRow {
    pledge_number: string;
    pledge_date: string;
    customer_name: string;
    customer_phone: string;
    loan_amount: number;
    interest_amount: number;
    total_paid: number;
    outstanding: number;
    status: string;
}

// Order Types
export interface Order {
    id: string; // ORD-XXXX
    user_id: string;
    total_amount: number;
    status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
    shipping_address: {
        fullName: string;
        street: string;
        city: string;
        zipCode: string;
        phone: string;
    };
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_name: string;
    price: number;
    weight: number;
    unit: string;
    image_url?: string;
    quantity: number;
    created_at: string;
}
