// import axios from 'axios';


// const API_BASE_URL = `https://payammu.com/api`;

// export const verifyGST = async (gstNumber: string) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/verify-gst`, { gstNumber });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const sendOTP = async (email: string) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/send-otp`, { email });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const verifyOTP = async (email: string, otp: string) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/verify-otp`, { email, otp });
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };

// export const registerUser = async (userData: {
//   email: string;
//   password: string;
//   shopName: string;
//   category: string;
//   address: string;
//   gstNumber?: string;
//   otp: string;
// }) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/register`, userData);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };