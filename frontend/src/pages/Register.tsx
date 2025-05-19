import { useState } from 'react';
import { Mail, Lock, Store, MapPin, Phone, FileText, Camera } from 'lucide-react';
import { registerUser, sendOTP, verifyOTP } from '../services/service';
 
interface RegisterProps {
  onLoginClick: () => void;
}
 
const roles = [
  { value: 'UNIVERSAL_ADMIN', label: 'Universal Admin', group: 'Admin Roles' },
  { value: 'MANAGE_ADMIN', label: 'Manage Admin', group: 'Admin Roles' },
  { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin (Store Owner)', group: 'Store Roles' },
  { value: 'MANAGER', label: 'Manager', group: 'Store Roles' },
  { value: 'STAFF', label: 'Staff', group: 'Store Roles' },
  { value: 'KITCHEN', label: 'Kitchen', group: 'Store Roles' },
  { value: 'DELIVERY', label: 'Delivery', group: 'Store Roles' }
];

 
export default function Register({ onLoginClick }: RegisterProps) {
  const [formData, setFormData] = useState({
    email: '',
    phone_number: '',
    otp: ['', '', '', '', '', ''],
    password: '',
    confirmPassword: '',
    role: '',
    shopName: '',
    gstin: '',
    category: '',
    address: '',
    subscription: '',
    image: null as File | null,
  });
 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
 
  const categories = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'dairy', label: 'Dairy Products' },
    { value: 'plywood', label: 'Plywood' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'groceries', label: 'Groceries' },
  ];
 
  const subscriptions = [
    { value: '1 month', label: '1 month' },
    { value: '3 months', label: '3 months' },
    { value: '6 months', label: '6 months' },
    { value: '1 year', label: '1 year' },
  ];
 
  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
 
    try {
      await sendOTP(formData.email);
      setOtpSent(true);
      startOTPTimer();
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code');
    }
  };
 
  const startOTPTimer = () => {
    setTimer(30);
    setCanResendOTP(false);
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setCanResendOTP(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
 
  const handleOTPChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
 
    const newOTP = [...formData.otp];
    newOTP[index] = element.value;
    setFormData({ ...formData, otp: newOTP });
 
    if (element.value && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
 
    if (newOTP.every(digit => digit !== '') && newOTP.join('').length === 6) {
      verifyOTPCode(newOTP.join(''));
    }
  };
 
  const handleOTPKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!formData.otp[index] && index > 0) {
        const newOTP = [...formData.otp];
        newOTP[index - 1] = '';
        setFormData({ ...formData, otp: newOTP });
        const prevInput = e.currentTarget.previousSibling as HTMLInputElement;
        if (prevInput) prevInput.focus();
      } else {
        const newOTP = [...formData.otp];
        newOTP[index] = '';
        setFormData({ ...formData, otp: newOTP });
      }
    }
  };
 
  const verifyOTPCode = async (otp: string) => {
    try {
      const response = await verifyOTP(formData.email, otp);
      if (response.success) {
        setOtpVerified(true);
        setError('');
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to verify OTP');
    }
  };
 
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    if (!otpVerified) {
      setError('Please verify your email first');
      setLoading(false);
      return;
    }
  
    const requiredFields = ['email', 'phone_number', 'password', 'confirmPassword', 'role', 'shopName', 'category', 'address', 'subscription'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
  
    if (missingFields.length > 0) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
  
    try {
      // Prepare the data as a plain JSON object
      const dataToSubmit = {
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        role: formData.role,
        shopName: formData.shopName,
        category: formData.category,
        address: formData.address,
        subscription: formData.subscription,
        gstin: formData.gstin || null,  // Optional field
        image: formData.image || null,  // Optional field
      };
  
      // Send the data as JSON
      await registerUser(dataToSubmit);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: 'url(login.webp)' }}>
      <div className="bg-white bg-opacity-80 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Get started with your business</p>
        </div>
 
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
 
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email and OTP Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email Address"
                  />
                </div>
              </div>
  
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={otpSent}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  {otpSent ? 'OTP Sent' : 'Send OTP'}
                </button>
              </div>
  
              {otpSent && !otpVerified && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Enter OTP</span>
                    <span className="text-sm text-gray-600">{timer}s</span>
                  </div>
                  <div className="flex space-x-2">
                    {formData.otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        value={digit}
                        onChange={(e) => handleOTPChange(e.target, index)}
                        onKeyDown={(e) => handleOTPKeyDown(e, index)}
                        maxLength={1}
                        className="w-10 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
 
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Phone Number"
              />
            </div>
          </div>
 
          {/* Password and Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Password"
              />
            </div>
          </div>
 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm Password"
              />
            </div>
          </div>
 
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
 
          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Shop Name"
              />
            </div>
          </div>
 
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
 
          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Address"
              />
            </div>
          </div>
 
          {/* GSTIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="GSTIN"
              />
            </div>
          </div>
 
          {/* subscription */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">subscription</label>
            <select
              value={formData.subscription}
              onChange={(e) => setFormData({ ...formData, subscription: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select subscription</option>
              {subscriptions.map((subscription) => (
                <option key={subscription.value} value={subscription.value}>
                  {subscription.label}
                </option>
              ))}
            </select>
          </div>
 
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Image</label>
            <div className="relative">
              <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-blue-600 text-white font-semibold rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
 
        <div className="mt-4 text-center">
          <p className="text-sm">
            Already have an account?{' '}
            <button onClick={onLoginClick} className="text-blue-600 hover:text-blue-700">Login</button>
          </p>
        </div>
      </div>
    </div>
  );
}