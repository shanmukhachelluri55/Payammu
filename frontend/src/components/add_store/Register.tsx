import { useState } from 'react';
import { Mail, Lock, Store, MapPin, Phone, FileText, Camera } from 'lucide-react';
import { registerUser, sendOTP, verifyOTP } from '../../services/service';


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
    image: null as File | string | null, // Can be File or Base64 string
    name: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showOTPOverlay, setShowOTPOverlay] = useState(false);

  const categories = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'dairy', label: 'Dairy Products' },
    { value: 'plywood', label: 'Plywood' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'groceries', label: 'Groceries' },
    { value: 'shopping', label: 'Shopping'},
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
  
    setLoading(true); // Set loading to true before starting the OTP request
    setError(''); // Clear previous errors, if any
  
    try {
      await sendOTP(formData.email); // Assuming sendOTP is your API call to send OTP
      setOtpSent(true); // OTP sent successfully
      setShowOTPOverlay(true); // Show OTP overlay modal
      startOTPTimer(); // Start the countdown timer
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code'); // Display error message
    } finally {
      setLoading(false); // Set loading to false once the request is complete
    }
  };
  
  const startOTPTimer = () => {
    setTimer(30); // Set initial timer to 30 seconds
    setCanResendOTP(false); // Disable resend OTP button initially
  
    // Start the countdown interval
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown); // Clear interval when timer reaches 0
          setCanResendOTP(true); // Enable resend OTP after countdown
          return 0; // Ensure timer doesn't go negative
        }
        return prev - 1; // Decrease timer by 1 second
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (canResendOTP) {
      setOtpSent(false); // Reset OTP sent status
      setOtpVerified(false); // Reset OTP verified status
      await handleSendOTP(); // Call the function to resend OTP
    }
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
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to handle the registration and show success notification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    // Check if email is verified
    if (!otpVerified) {
      setError('Please verify your email first');
      setLoading(false);
      return;
    }
  
    // Define required fields for validation
    const requiredFields = ['email', 'phone_number', 'password', 'confirmPassword', 'role', 'shopName', 'category', 'address', 'subscription', 'name'];
    
    // Check for any missing required fields
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
  
    if (missingFields.length > 0) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
  
    // Ensure passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
  
    // Prepare the data to submit
    const dataToSubmit = {
      email: formData.email,
      phone_number: formData.phone_number,
      password: formData.password,
      role: formData.role,
      shopName: formData.shopName,
      category: formData.category,
      address: formData.address,
      subscription: formData.subscription,
      gstin: formData.gstin || null,
      image: formData.image,
      licence_name: formData.name,
    };
  
    try {
      // Submit registration data
      await registerUser(dataToSubmit);
  
      // Show success modal if registration is successful
      setShowSuccessModal(true);

      setFormData({
        email: '',
        phone_number: '',
        otp: [], // Resetting 'otp' to an empty array
        password: '',
        confirmPassword: '',
        role: '',
        shopName: '',
        category: '',
        address: '',
        subscription: '',
        gstin: '',
        image: '', // Or set this to null, depending on your state
        name: ''
      });
      

  
    } catch (err: any) {
      // Handle error with more informative message
      setError(err?.message || 'Registration failed');
    } finally {
      // Stop loading animation regardless of success or failure
      setLoading(false);
    }
  };
  
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: 'url(doll.jpg)' }}>
      <div className="bg-white bg-opacity-80 rounded-2xl shadow-xl w-full max-w-[800px] p-6">

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Store</h1>
          <p className="text-gray-600">Get started with your business</p>
        </div>
 
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
 
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email and OTP Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Email Address"
          />
          {/* OTP verification status */}
          {!otpVerified && !otpSent && (
            <span
              onClick={handleSendOTP}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 text-sm font-semibold cursor-pointer"
            >
              Verify
            </span>
          )}
          {otpSent && !otpVerified && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500 text-sm font-semibold">
              OTP Sent
            </span>
          )}
          {otpVerified && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-sm font-semibold">
              ✔
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your name"
          />
        </div>
      </div>

      {/* OTP Overlay Modal */}
      {showOTPOverlay && !otpVerified && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-96 shadow-lg transform transition-all duration-300 scale-100 space-y-4">
      <div className="flex justify-between items-center">
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
            className="w-12 h-12 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
          />
        ))}
      </div>
      <div className="mt-4 text-center space-x-4">
        <button
          type="button"
          onClick={() => setOtpVerified(true)}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
        >
          Verify OTP
        </button>
        <button
          type="button"
          onClick={() => setShowOTPOverlay(false)}
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
        >
          Close
        </button>
      </div>

      {/* Resend OTP button */}
      {canResendOTP && !otpVerified && (
        <button
          type="button"
          onClick={handleResendOTP} // Resend OTP when button clicked
          className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Resend OTP
        </button>
      )}
    </div>
  </div>
)}


      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent black
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            border: '4px solid #f3f3f3', // Light grey
            borderTop: '4px solid #3498db', // Blue
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 2s linear infinite'
          }} />
        </div>
      )}
    </div>

            
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* Phone Number */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Phone Number <span className="text-red-500">*</span>
    </label>
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
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Password <span className="text-red-500">*</span>
    </label>
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
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Confirm Password <span className="text-red-500">*</span>
    </label>
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
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Role <span className="text-red-500">*</span>
    </label>
    <select
      value={formData.role}
      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select Role <span className="text-red-500">*</span></option>
      {roles.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  </div>

  {/* Shop Name */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Shop Name <span className="text-red-500">*</span>
    </label>
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
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Category <span className="text-red-500">*</span>
    </label>
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
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Address <span className="text-red-500">*</span>
    </label>
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
    <label className="block text-sm font-medium text-gray-700 mb-2">
      GSTIN (optional)
    </label>
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

  {/* Subscription */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Subscription <span className="text-red-500">*</span>
    </label>
    <select
      value={formData.subscription}
      onChange={(e) => setFormData({ ...formData, subscription: e.target.value })}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select Subscription</option>
      {subscriptions.map((subscription) => (
        <option key={subscription.value} value={subscription.value}>
          {subscription.label}
        </option>
      ))}
    </select>
  </div>

  {/* Image Upload */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Shop Image (optional)
    </label>
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
</div>

 
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-blue-600 text-white font-semibold rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {showSuccessModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-semibold text-green-600">Registration Successful!</h2>
      <p className="text-gray-700 mt-4">Your account has been created successfully. You can now login.</p>
      <button
        onClick={() => setShowSuccessModal(false)} // Close the modal when clicked
        className="mt-6 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
      >
        Close
      </button>
    </div>
  </div>
)}

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