import api from '../lib/api';
import { JewelryItem, PawnRequest } from '../lib/supabase';

export class ApiService {
  // Jewelry Items
  static async getJewelryItems(): Promise<JewelryItem[]> {
    const response = await api.get('/jewelry');
    return response.data.data || [];
  }

  static async createJewelryItem(item: Omit<JewelryItem, 'id' | 'created_at' | 'updated_at'>): Promise<JewelryItem> {
    const response = await api.post('/jewelry', item);
    return response.data.data;
  }

  static async updateJewelryItem(id: string, item: Partial<JewelryItem>): Promise<JewelryItem> {
    const response = await api.put(`/jewelry/${id}`, item);
    return response.data.data;
  }

  static async deleteJewelryItem(id: string): Promise<void> {
    await api.delete(`/jewelry/${id}`);
  }

  // Pawn Requests
  static async getPawnRequests(userId?: string): Promise<PawnRequest[]> {
    const response = await api.get('/pledges', { params: { userId } });
    return response.data.data || [];
  }

  static async createPawnRequest(request: Omit<PawnRequest, 'id' | 'created_at' | 'updated_at'>): Promise<PawnRequest> {
    const response = await api.post('/pledges', request);
    return response.data.data;
  }

  static async updatePawnRequestStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<PawnRequest> {
    const response = await api.patch(`/pledges/${id}/status`, { status });
    return response.data.data;
  }

  // User Profile
  static async getUserProfile(userId: string) {
    const response = await api.get(`/auth/me`); // Or specific profile endpoint
    return response.data.data;
  }

  static async updateUserProfile(userId: string, profile: { full_name?: string }) {
    const response = await api.put(`/auth/profile`, profile);
    return response.data.data;
  }

  // Admin functions
  static async getAllPawnRequests(): Promise<PawnRequest[]> {
    const response = await api.get('/pledges/admin/all');
    return response.data.data || [];
  }
}
