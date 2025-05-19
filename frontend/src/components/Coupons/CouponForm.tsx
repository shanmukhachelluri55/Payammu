import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Tag, IndianRupee, Calculator } from 'lucide-react';
import { couponService } from '../../services/coupons_service';
import toast from 'react-hot-toast';
import type { Coupon } from '../../types/coupon';
import ScrollToTopButton from '../SalesReport/ScrollToTopButton';

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    type: 'percentage' as const,
    validUntil: '',
    description: '',
    minBillAmount: '',
  });
  const [error, setError] = useState('');
  const [previewAmount, setPreviewAmount] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [discountedAmount, setDiscountedAmount] = useState<number | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponService.getCoupons();
      setCoupons(data);
    } catch (error) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.code || !formData.discount || !formData.validUntil || !formData.minBillAmount) {
      setError('Please fill in all required fields');
      return false;
    }
    if (coupons.some(coupon => coupon.code === formData.code.toUpperCase())) {
      setError('Coupon code already exists');
      return false;
    }
    if (Number(formData.discount) <= 0) {
      setError('Discount must be greater than 0');
      return false;
    }
    if (formData.type === 'percentage' && Number(formData.discount) > 100) {
      setError('Percentage discount cannot exceed 100%');
      return false;
    }
    if (Number(formData.minBillAmount) < 0) {
      setError('Minimum bill amount cannot be negative');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const newCoupon = await couponService.createCoupon({
        code: formData.code.toUpperCase(),
        discount: Number(formData.discount),
        type: formData.type,
        validUntil: formData.validUntil,
        description: formData.description,
        minBillAmount: Number(formData.minBillAmount),
        userId: localStorage.getItem('userId') // Assume userId is stored in localStorage
      });

      setCoupons(prev => [...prev, newCoupon]);
      toast.success('Coupon created successfully');
      
      setFormData({
        code: '',
        discount: '',
        type: 'percentage',
        validUntil: '',
        description: '',
        minBillAmount: '',
      });
    } catch (error) {
      toast.error('Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await couponService.deleteCoupon(id);
      setCoupons(prev => prev.filter(coupon => coupon.id !== id));
      toast.success('Coupon deleted successfully');
      
      if (selectedCoupon?.id === id) {
        setSelectedCoupon(null);
        setDiscountedAmount(null);
      }
    } catch (error) {
      toast.error('Failed to delete coupon');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (!selectedCoupon || !previewAmount) return;

    const billAmount = Number(previewAmount);
    if (billAmount < selectedCoupon.minBillAmount) {
      setError(`Minimum bill amount should be ₹${selectedCoupon.minBillAmount.toLocaleString('en-IN')}`);
      setDiscountedAmount(null);
      return;
    }

    const discount = selectedCoupon.type === 'percentage'
      ? billAmount * (selectedCoupon.discount / 100)
      : selectedCoupon.discount;

    setDiscountedAmount(billAmount - discount);
    setError('');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Create Coupon Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <Tag className="h-6 w-6 text-indigo-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">New Coupon</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="mt-1 block w-full h-10 p-2 rounded-md border-gray-300 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="SUMMER2024"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full h-10 p-2 rounded-md border  border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={loading}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full h-10 p-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={formData.type === 'percentage' ? '10' : '100'}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Minimum Bill Amount <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="number"
                    name="minBillAmount"
                    value={formData.minBillAmount}
                    onChange={handleInputChange}
                    className="pl-8 block w-full h-10 p-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="1000"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Validity <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  className="mt-1 block w-full h-10 p-2  rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={loading}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-900">
                  Coupon Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full p-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter coupon description..."
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              {loading ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <Calculator className="h-6 w-6 text-indigo-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Discount Calculator</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-900">
                Bill Amount <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="number"
                  value={previewAmount}
                  onChange={(e) => setPreviewAmount(e.target.value)}
                  className="pl-8 block w-full h-10 p-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter bill amount"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">
                Select Coupon <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCoupon?.id || ''}
                onChange={(e) => {
                  const coupon = coupons.find(c => c.id === e.target.value);
                  setSelectedCoupon(coupon || null);
                  setDiscountedAmount(null);
                  setError('');
                }}
                className="mt-1 block w-full h-10 p-2 rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a coupon</option>
                {coupons.map(coupon => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.code} - {coupon.type === 'percentage' ? `${coupon.discount}% off` : `₹${coupon.discount} off`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={calculateDiscount}
            disabled={!selectedCoupon || !previewAmount}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Calculator className="h-5 w-5 mr-2" />
            Calculate Discount
          </button>

          {discountedAmount !== null && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <h3 className="text-lg font-medium text-green-800">Discount Summary</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Original Amount: ₹{Number(previewAmount).toLocaleString('en-IN')}</p>
                <p>Discount Applied: ₹{(Number(previewAmount) - discountedAmount).toLocaleString('en-IN')}</p>
                <p className="font-bold">Final Amount: ₹{discountedAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Active Coupons List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Active Coupons</h2>
          {loading ? (
            <div className="text-center py-4">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No coupons created yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-6 rounded-lg shadow-md">
  {coupons.map((coupon) => (
    <div
      key={coupon.id}
      className="relative flex flex-col items-center justify-between w-full p-5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105 hover:rotate-1 hover:skew-y-1 duration-300"
    >
      {/* Delete Button in Corner */}
      <button
        onClick={() => handleDelete(coupon.id)}
        disabled={loading}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <Trash2 className="h-5 w-5" />
      </button>

      {/* Main Content */}
      <h3 className="text-2xl font-extrabold tracking-wider uppercase text-center drop-shadow-lg">
        {coupon.code}
      </h3>
      <p className="mt-2 text-4xl font-bold text-center drop-shadow">
        {coupon.type === 'percentage' ? `${coupon.discount}%` : `₹${coupon.discount}`}
      </p>
      <p className="mt-1 text-sm font-light text-center">
        Min. Bill Amount: ₹{coupon.minBillAmount.toLocaleString('en-IN')}
      </p>
      <p className="mt-1 text-sm font-light text-center">
        Valid until: {new Date(coupon.validUntil).toLocaleDateString()}
      </p>
      {coupon.description && (
        <p className="mt-2 text-xs italic text-center opacity-90">{coupon.description}</p>
      )}
    </div>
  ))}
</div>

          )}
        </div>

      </div>
      <ScrollToTopButton />
    </div>
  );
}