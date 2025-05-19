import axios from 'axios';
import { BASE_URL } from '../services/service';

const API_URL = `${BASE_URL}/api/coupons`;

export const couponService = {
  // Get coupons for a specific user
  getCoupons: async () => {
    const userId = localStorage.getItem('userId');
    const response = await axios.get(`${API_URL}/${userId}`);
    return response.data;
  },

  // Create a new coupon
  createCoupon: async (couponData: any) => {
    const response = await axios.post(API_URL, couponData);
    return response.data;
  },

  // Delete a coupon by ID
  deleteCoupon: async (id: any) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  }
};
