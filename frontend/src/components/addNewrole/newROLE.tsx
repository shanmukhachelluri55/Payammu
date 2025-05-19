import React, { useState } from 'react';
import { Mail, KeyRound, UserCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { BASE_URL } from '../../services/service';

const AUTH_BASE_URL = `${BASE_URL}/api/auth`;
const ROLES = [
  { id: 'MANAGER', label: 'Manager' },
  { id: 'STAFF', label: 'Staff' },
  { id: 'KITCHEN', label: 'Kitchen Staff' },
  { id: 'DELIVERY', label: 'Delivery Person' },
] as const;

function AddRole() {
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    role: 'STAFF' as const,
    isEmailVerified: false,
    loading: false,
    name: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSendOTP = async () => {
    try {
      setFormData((prev) => ({ ...prev, loading: true }));
      const { data } = await axios.post(
        `${AUTH_BASE_URL}/send-otp`,
        { email: formData.email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success('OTP sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
      console.error('Error Details:', error);
    } finally {
      setFormData((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setFormData((prev) => ({ ...prev, loading: true }));
      const { data } = await axios.post(
        `${AUTH_BASE_URL}/verify-otp`,
        { email: formData.email, otp: formData.otp },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (data.success) {
        setFormData((prev) => ({ ...prev, isEmailVerified: true }));
        toast.success('Email verified successfully!');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to verify OTP. Please try again.');
      console.error('Error Details:', error);
    } finally {
      setFormData((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSubmit = async () => {
    try {
      setFormData((prev) => ({ ...prev, loading: true }));
      const userId = localStorage.getItem('userId');
      if (!userId) return toast.error('User ID not found. Please log in again.');

      if (!formData.password) return toast.error('Password is required.');

      const { data } = await axios.post(`${AUTH_BASE_URL}/AddNewrole`, {
        email: formData.email,
        password: formData.password,
        licence_name: formData.name,
        role: formData.role,
        user_id: userId,
      });
      
      toast.success('Registration completed successfully!');
    } catch (error) {
      toast.error('Failed to complete registration. Please try again.');
      console.error('Error Details:', error);
    } finally {
      setFormData((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">
        <div className="text-center">
          <UserCircle className="mx-auto h-16 w-16 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Create New Role</h1>
          <p className="mt-2 text-gray-600">Please complete the form to New Role</p>
        </div>

        <div className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2 border"
                placeholder="Enter your email"
              />
            </div>
            <button
              onClick={handleSendOTP}
              disabled={formData.loading || !formData.email}
              className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {formData.loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>

          {/* OTP Field */}
          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">OTP Verification</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                id="otp"
                type="text"
                value={formData.otp}
                onChange={handleChange('otp')}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2 border"
                placeholder="Enter OTP"
              />
            </div>
            <button
              onClick={handleVerifyOTP}
              disabled={formData.loading || !formData.otp}
              className="mt-2 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {formData.loading ? 'Verifying OTP...' : 'Verify OTP'}
            </button>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your name"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2 border"
              placeholder="Enter your password"
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Select Role</label>
            <select
              id="role"
              value={formData.role}
              onChange={handleChange('role')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2 border"
            >
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={formData.loading || !formData.isEmailVerified}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {formData.loading ? 'Processing...' : 'Complete Registration'}
          </button>

          {/* Status Indicators */}
          <div className="text-center space-y-2 text-sm">
            <p className={`${formData.isEmailVerified ? 'text-green-600' : 'text-gray-500'}`}>
              {formData.isEmailVerified ? '✓ Email Verified' : 'Email not verified'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddRole;
