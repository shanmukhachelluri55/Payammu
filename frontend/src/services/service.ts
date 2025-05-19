import axios from 'axios';
import type { Item } from '../types';
import { SaleData } from '../types';
import type { OTPResponse, VerifyOTPResponse } from '../types/otpindex';
 
 
export const BASE_URL = 'http://localhost:5000'; 
export const API_BASE_URL = `${BASE_URL}/api/items`;
export const AUTH_BASE_URL = `${BASE_URL}/api/auth`;
export const AUTH_BASE = `${BASE_URL}/api`;
 
 
 
// service.ts
 
// Use BASE_URL for API calls
export const searchStoreByEmail = async (email: string) => {
  const response = await fetch(`${BASE_URL}/api/razorpay/store-lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
 
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Store not found');
  }
 
  return response.json();
};
 
export const saveRazorpayCredentials = async (formData: { store_id: number; key_id: string; key_secret: string }) => {
  const response = await fetch(`${BASE_URL}/api/razorpay/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      store_id: formData.store_id,
      key_id: formData.key_id,
      key_secret: formData.key_secret,
    }),
  });
 
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save credentials');
  }
 
  return response.json();
};
 
 
///////////////////////////////////////////////////////
 
export const fetchItems = async (userId: string): Promise<Item[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}?userId=${userId}`);
    return response.data;
  } catch (error) {
    const itemError = new Error('Failed to fetch items. Please try again later.') as ItemError;
    itemError.code = 'FETCH_ERROR';
    throw itemError;
  }
};
 
export const addItem = async (item: Partial<Item>): Promise<Item> => {
  try {
    const itemWithStock = {
      ...item,
      stockPosition: item.stockPosition || 0,
      minStock: item.minStock || 0
    };
    const response = await axios.post(API_BASE_URL, itemWithStock);
    return response.data;
  } catch (error) {
    const itemError = new Error('Failed to add item. Please try again later.') as ItemError;
    itemError.code = 'ADD_ERROR';
    throw itemError;
  }
};
 
export const updateItem = async (itemId: string, item: Partial<Item>): Promise<Item> => {
  try {
    const itemWithStock = {
      ...item,
      stockPosition: item.stockPosition ?? 0,
      minStock: item.minStock ?? 0
    };
    const response = await axios.put(`${API_BASE_URL}/${itemId}`, itemWithStock);
    return response.data;
  } catch (error) {
    const itemError = new Error('Failed to update item. Please try again later.') as ItemError;
    itemError.code = 'UPDATE_ERROR';
    throw itemError;
  }
};
 
export const deleteItem = async (itemId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${itemId}`);
  } catch (error) {
    const itemError = new Error('Failed to delete item. Please try again later.') as ItemError;
    itemError.code = 'DELETE_ERROR';
    throw itemError;
  }
};
 
export const updateStock = async (itemId: string, stockPosition: number): Promise<Item> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/${itemId}/stock`, { stockPosition });
    return response.data;
  } catch (error) {
    const itemError = new Error('Failed to update stock. Please try again later.') as ItemError;
    itemError.code = 'STOCK_UPDATE_ERROR';
    throw itemError;
  }
};
 
//////////////////////////////////////////////////////////////////////////
 
export const loginUser = async (
  email: string,
  password: string
): Promise<{
  userId: number;
  email: string;
  shopName: string;
  address: string;
  gstin: string;
  role: string;
  name: string;
  licenseId: number;
  phoneNumber: number; // ✅ Ensure phoneNumber is a number
  imageUrl: string | null;
}> => {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/login`, { email, password });

    // Destructure response data
    const {
      user_id: userId,
      email: userEmail,
      shopName,
      address,
      gstin,
      role,
      name,
      license_id: licenseId,
      phoneNumber, // ✅ Extract phoneNumber
      imageUrl
    } = response.data;

    // Validate mandatory fields
    if (!userId || !userEmail || !shopName || !address || !role || !name || licenseId === undefined) {
      throw new Error('Invalid response from server.');
    }

    // Convert phoneNumber to a number before storing
    const phoneNumberNumeric = Number(phoneNumber); 

    // Cache user details in localStorage
    localStorage.setItem('userId', String(userId));
    localStorage.setItem('email', userEmail);
    localStorage.setItem('shopName', shopName);
    localStorage.setItem('address', address);
    localStorage.setItem('gstin', gstin);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    localStorage.setItem('licenseId', String(licenseId));
    localStorage.setItem('phoneNumber', String(phoneNumberNumeric)); // ✅ Store as a number

    if (imageUrl) {
      localStorage.setItem('imageUrl', imageUrl);
    } else {
      localStorage.removeItem('imageUrl');
    }

    return {
      userId,
      email: userEmail,
      shopName,
      address,
      gstin,
      role,
      name,
      licenseId,
      phoneNumber: phoneNumberNumeric, // ✅ Ensure it's returned as a number
      imageUrl: imageUrl || null
    };
  } catch (error) {
    console.error('Error logging in:', error);

    // Clear any cached data in case of error
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('shopName');
    localStorage.removeItem('address');
    localStorage.removeItem('gstin');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('licenseId');
    localStorage.removeItem('phoneNumber'); // ✅ Remove phoneNumber if there's an error
    localStorage.removeItem('imageUrl');

    throw new Error('Failed to log in. Please check your credentials.');
  }
};
 
 
 
 
 
// Register API request
export const registerUser = async (formData: {
  email: string;
  password: string;
  shopName: string;
  gstin?: string; // GSTIN is optional
  category: string;
  address: string;
}): Promise<{ message: string }> => {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/register`, formData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw new Error('Registration failed. Please try again later.');
  }
};
 
export interface Bill {
  id: string;
  date: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  gst: number;
  serviceCharge: number;
  total: number;
  status: 'paid' | 'pending' | 'cancelled' | 'deleted';
  cancellationReason?: string;
  deletedAt?: string;
}
 
export const sendOTP = async (email: string): Promise<OTPResponse> => {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/send-otp`, { email });
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
};
 
export const verifyOTP = async (email: string, otp: string): Promise<VerifyOTPResponse> => {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/verify-otp`, { email, otp });
    return response.data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error('Failed to verify OTP. Please try again.');
  }
};
 
 
// Forgot Password API Request
export const forgotPassword = async (email: string) => {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    console.error('Error in forgot password API:', error);
    throw new Error('Failed to process forgot password request. Please try again later.');
  }
};
 
// Reset Password API Request
export const resetPassword = async (email: string, password: string, confirmPassword: string) => {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/reset-password`, {
      email,
      password,
      confirmPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Error in reset password API:', error);
    throw new Error('Failed to reset password. Please try again later.');
  }
};
 
// Verify OTP for Reset Password API Request
export const verifyOTPResetPassword = async (email: string, otp: string) => {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/verify-otp-resetpassword`, { email, otp });
    return response.data;
  } catch (error) {
    console.error('Error in verify OTP for reset password API:', error);
    throw new Error('Failed to verify OTP. Please try again later.');
  }
};
 
 
let lastFetchedBillNumber: number | null = null;
let currentBillNumber: number = 1;  // Initialize currentBillNumber
 
export const fetchBillNumber = async (): Promise<number> => {
  const userId = localStorage.getItem('userID');
  if (!userId) {
    throw new Error('User ID not found in localStorage');
  }
 
  try {
    const response = await fetch(`${AUTH_BASE}/next-bill-number?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch the next bill number');
    }
 
    const data = await response.json();
    lastFetchedBillNumber = data.nextBillNumber || 1;
    currentBillNumber = lastFetchedBillNumber; // Sync currentBillNumber with the fetched number
    return currentBillNumber;
  } catch (error) {
    console.error('Error fetching bill number:', error);
    throw error;
  }
};
 
export const getCurrentBillNumber = (): number => {
  if (lastFetchedBillNumber === null) {
    throw new Error('Bill number not initialized');
  }
  return currentBillNumber;
};
 
export const incrementBillNumber = (): number => {
  currentBillNumber += 1;
  lastFetchedBillNumber = currentBillNumber; // Sync with lastFetchedBillNumber
  return currentBillNumber;
};
 
 
 
export const saveBill = async (saleData: SaleData) => {
  try {
    // Step 1: Convert the saleData to a JSON string
    const jsonData = JSON.stringify(saleData);

    // Step 2: Send the data with the appropriate headers
    const response = await fetch(`${AUTH_BASE}/bills/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonData, // Send the JSON data
    });

    console.log(response);

    // Step 3: Handle the response
    if (!response.ok) {
      throw new Error('Failed to save bill');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving bill:', error);
    throw error;
  }
};

 
 
// service.ts
 
 
 
/**
 * Fetches sales data for the user from the API
 * @param userId - The user ID for whom the sales data is to be fetched
 * @returns A promise that resolves to the sales data
 */
export const fetchSalesData = async (userId: string): Promise<Bill[]> => {
  try {
    const response = await fetch(`${AUTH_BASE}/bills/details?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sales data');
    }
    const data: Bill[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
};
 
export const fetchBillsData = async (userId: string): Promise<Bill[]> => {
  try {
    const response = await fetch(`${AUTH_BASE}/bills/details?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sales data');
    }
    const data: Bill[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
};


export const sendReceipt = async (pdfBlob: Blob, email: string, billNumber: number): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append('pdf', pdfBlob, `receipt_${billNumber}.pdf`);
    formData.append('email', email);

    const response = await fetch(`${BASE_URL}/api/send-receipt`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to send receipt');
    }

    // const result = await response.json();
    // alert(result.message || 'Receipt sent successfully!');
  } catch (error) {
    console.error('Error sending receipt:', error);
    alert(error instanceof Error ? error.message : 'An error occurred. Please try again.');
  }
};
