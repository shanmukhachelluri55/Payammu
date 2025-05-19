import {BASE_URL} from '../services/service';


interface CustomerResponse {
  address: string;
  email: string;
  id: number;
  user_id: number;
  name: string;
  phone: string;
  royalty_points: number;
}

interface CustomerUpdateData {
  name: string;
  phone: string;
  royalty_points: number;
  usePoints: boolean;
}

class RoyaltyService {
  private readonly API_BASE_URL =  `${BASE_URL}/api/royalty`;

  private getUserId(): string {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('User ID not found in localStorage');
    }
    return userId;
  }

  // Fetch a customer by user_id and phone
  async getCustomerByPhone(phone: string): Promise<CustomerResponse | null> {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.API_BASE_URL}/customers/${userId}/${phone}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch customer');
      }

      const { customer } = await response.json();
      return customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  // Create or update a customer with royalty points
  async createOrUpdateCustomer(data: CustomerUpdateData): Promise<CustomerResponse> {
    try {
      const userId = this.getUserId();
      const response = await fetch(`${this.API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create or update customer');
      }

      const { customer } = await response.json();
      return customer;
    } catch (error) {
      console.error('Error creating or updating customer:', error);
      throw error;
    }
  }
}

export const royaltyService = new RoyaltyService();

import axios from 'axios';

interface RazorpayCredentials {
  key_id: string;
  key_secret: string;
}

class RazorpayService {
  private baseUrl = 'http://your-api-url/api'; // Replace with your actual API URL

  async getCredentials(storeId: number): Promise<RazorpayCredentials> {
    try {
      const response = await axios.get(`${this.baseUrl}/razorpay/credentials/${storeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Razorpay credentials:', error);
      throw error;
    }
  }

  async createOrder(amount: number, currency: string = 'INR'): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/razorpay/create-order`, {
        amount: amount * 100, // Razorpay expects amount in paise
        currency
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }
}

export const razorpayService = new RazorpayService();
