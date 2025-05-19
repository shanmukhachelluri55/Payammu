import { Plus, Minus, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { couponService } from '../../services/coupons_service';
import type { Item, ItemVariant } from '../../types';

interface CartSectionProps {
  currentBillNumber: number;
  cart: Item[];
  gstRate: number;
  serviceCharge: number;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onUpdateGstRate: (rate: number) => void;
  onUpdateServiceCharge: (rate: number) => void;
  onInitializePayment: () => void;
  onUpdateDiscount: (discountAmount: number) => void;
}

interface Coupon {
  code: string;
  discount: number;
  type: string;
  minBillAmount: number;
}

// Export the variant information at the top level
export function getItemVariant(item: Item): ItemVariant {
  return {
    subVariant: item.subVariant
  };
}

export function CartSection({
  currentBillNumber,
  cart,
  gstRate,
  serviceCharge,
  onUpdateQuantity,
  onUpdateGstRate,
  onUpdateServiceCharge,
  onInitializePayment,
  onUpdateDiscount,
}: CartSectionProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [discountApplied, setDiscountApplied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  useEffect(() => {
    setSelectedCoupon('');
    setDiscount(0);
    setDiscountApplied(false);
    setErrorMessage('');
  }, [currentBillNumber]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const data = await couponService.getCoupons();
        setCoupons(data);
      } catch (error) {
        console.error('Error fetching coupons:', error);
      }
    };

    fetchCoupons();
  }, []);

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const gstAmount = (subtotal * gstRate) / 100;
    const serviceChargeAmount = (subtotal * serviceCharge) / 100;
    const totalBeforeDiscount = subtotal + gstAmount + serviceChargeAmount;

    return { subtotal, gstAmount, serviceChargeAmount, totalBeforeDiscount };
  };

  const handleCouponApply = () => {
    const coupon = coupons.find(c => c.code === selectedCoupon);
    if (coupon) {
      const { totalBeforeDiscount } = calculateTotals();

      if (totalBeforeDiscount >= coupon.minBillAmount) {
        setDiscount(coupon.discount);
        setDiscountApplied(true);
        setErrorMessage('');
      } else {
        setDiscount(0);
        setDiscountApplied(false);
        setErrorMessage(`The minimum bill amount of ₹${coupon.minBillAmount} is required to apply this coupon.`);
      }
    } else {
      setDiscount(0);
      setDiscountApplied(false);
      setErrorMessage('Invalid coupon code.');
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    onUpdateQuantity(itemId, delta);

    const { totalBeforeDiscount } = calculateTotals();
    const coupon = coupons.find(c => c.code === selectedCoupon);
    if (coupon && totalBeforeDiscount < coupon.minBillAmount) {
      setDiscount(0);
      setDiscountApplied(false);
      setErrorMessage(`The minimum bill amount of ₹${coupon.minBillAmount} is required to apply this coupon.`);
    }
  };

  const handleClearCart = () => {
    cart.forEach(item => onUpdateQuantity(item.id, -item.quantity));
  };

  const { subtotal, gstAmount, serviceChargeAmount, totalBeforeDiscount } = calculateTotals();
  const discountAmount = (totalBeforeDiscount * discount) / 100;
  const total = totalBeforeDiscount - discountAmount;

  useEffect(() => {
    onUpdateDiscount(discountAmount);
  }, [discountAmount, onUpdateDiscount]);

  return (
    <div className="w-full max-w-xs mx-auto bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-xl shadow-lg flex flex-col h-full transform transition-all duration-300 hover:shadow-xl">
  {/* Header */}
  <div className="flex-none p-3 border-b bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl">
    <h2 className="text-sm font-semibold flex items-center gap-2 text-white">
      <ShoppingCart className="w-4 h-4" />
      Bill #{currentBillNumber}
    </h2>
  </div>

  {/* Cart Items - Scrollable */}
  <div className="flex-1 p-2 overflow-y-auto">
    <div className="space-y-2">
      {cart.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group transform hover:scale-[1.02]"
        >
          <img
            src={item.image}
            alt={item.name}
            className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h3>
            {item.subVariant && (
              <p className="text-xs text-gray-600">Variant: {item.subVariant}</p>
            )}
            <p className="text-blue-600 font-medium text-sm">₹{parseFloat(item.price).toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
            <button
              onClick={() => handleQuantityChange(item.id, -1)}
              className="p-1 rounded-full bg-white shadow-sm hover:bg-red-50 text-red-500 transition-all duration-200 hover:scale-110"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center font-medium text-gray-700">{item.quantity}</span>
            <button
              onClick={() => handleQuantityChange(item.id, 1)}
              className="p-1 rounded-full bg-white shadow-sm hover:bg-green-50 text-green-500 transition-all duration-200 hover:scale-110"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Bottom Section - Fixed */}
  <div className="flex-none border-t bg-white p-3 space-y-3 rounded-b-xl">
    {/* Collapsible Details Button */}
    <button
      onClick={() => setIsDetailsOpen(!isDetailsOpen)}
      className="w-full flex items-center justify-between p-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
    >
      <span className="font-medium text-sm text-gray-700">Bill Details</span>
      {isDetailsOpen ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>

    {/* Collapsible Content */}
    {isDetailsOpen && (
      <>
        {/* GST and Service Charge */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">GST Rate</label>
            <select
              value={gstRate}
              onChange={(e) => onUpdateGstRate(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-xs py-1 px-1.5 bg-gray-50 text-gray-800"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Service Charge</label>
            <select
              value={serviceCharge}
              onChange={(e) => onUpdateServiceCharge(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-xs py-1 px-1.5 bg-gray-50 text-gray-800"
            >
              <option value="0">0%</option>
              <option value="1">1%</option>
              <option value="2">2%</option>
              <option value="3">3%</option>
              <option value="4">4%</option>
              <option value="5">5%</option>
            </select>
          </div>
        </div>

        {/* Coupon Section */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700">Apply Coupon</label>
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCoupon}
              onChange={(e) => setSelectedCoupon(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-xs py-1 px-1.5 bg-gray-50 text-gray-800"
            >
              <option value="">Select Coupon</option>
              {coupons.map((coupon) => (
                <option key={coupon.code} value={coupon.code}>
                  {coupon.code}
                </option>
              ))}
            </select>
            <button
              onClick={handleCouponApply}
              className="bg-blue-600 text-white py-1 px-2.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow whitespace-nowrap"
            >
              Apply
            </button>
          </div>
          {errorMessage && (
            <p className="text-red-500 text-xs bg-red-50 p-1.5 rounded-lg">{errorMessage}</p>
          )}
        </div>
      </>
    )}

    {/* Bill Summary - Always Visible */}
    <div className="space-y-1 bg-gray-50 p-2 rounded-lg text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>₹{subtotal.toFixed(2)}</span>
      </div>
      {(gstRate > 0 || serviceCharge > 0 || discount > 0) && (
        <>
          {gstRate > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>GST ({gstRate}%)</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>
          )}
          {serviceCharge > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Service ({serviceCharge}%)</span>
              <span>₹{serviceChargeAmount.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount ({discount}%)</span>
              <span className="text-green-600">-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
        </>
      )}
      <div className="pt-1 border-t border-gray-200 mt-1">
        <div className="flex justify-between font-semibold text-base">
          <span className="text-gray-800">Total</span>
          <span className="text-blue-600">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    {/* Action Buttons - Always Visible */}
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={onInitializePayment}
        disabled={cart.length === 0}
        className={`w-full py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
          cart.length === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        Preview & Pay
      </button>
      <button
        onClick={handleClearCart}
        disabled={cart.length === 0}
        className={`w-full py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
          cart.length === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        Clear Cart
      </button>
    </div>
  </div>
</div>
  );
}

export { type ItemVariant };