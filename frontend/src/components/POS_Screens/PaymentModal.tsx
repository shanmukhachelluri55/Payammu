import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, Smartphone, Car as Card } from 'lucide-react';
import type { PaymentSplit } from '../../types';
import { royaltyService } from '../../services/Royaltyservice';
import {BASE_URL} from '../../services/service';

interface PaymentModalProps {
  total: number;
  remainingAmount: number;
  currentPayment: PaymentSplit;
  payments: PaymentSplit[];
  onPaymentMethodSelect: (method: 'CASH' | 'RAZORPAY' | 'UPI' | 'CARD') => void;
  onPaymentAmountChange: (amount: number) => void;
  onUpdateTotal: (newTotal: number) => void;
  onAddPayment: () => void;
  onBack: () => void;
  onEmailPass: (email: string) => void;
}

interface Customer {
  name: string;
  phone: string;
  royalty_points: number;
  email?: string;
  address?: string;
}

export function PaymentModal({
  total,
  remainingAmount,
  currentPayment,
  payments,
  onPaymentMethodSelect,
  onPaymentAmountChange,
  onUpdateTotal,
  onAddPayment,
  onBack,
  onEmailPass,
}: PaymentModalProps) {
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [royaltyPointsUsed, setRoyaltyPointsUsed] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(0);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [skipPointsForNext, setSkipPointsForNext] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      setError('Payment system is still loading. Please wait...');
      return;
    }

    try {
      setPaymentProcessing(true);
      setError('');
      
      const storeName = localStorage.getItem('shopName') || 'Your Store Name';
  
      const orderResponse = await fetch(`${BASE_URL}/api/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: remainingAmount,
          currency: 'INR',
          store_id: localStorage.getItem('userId'),
          customer: currentCustomer ? {
            name: currentCustomer.name,
            phone: currentCustomer.phone,
          } : undefined,
        }),
      });
  
      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }
  
      const orderData = await orderResponse.json();
  
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: storeName,
        description: `Payment for Order #${orderData.receipt}`,
        order_id: orderData.id,
        prefill: currentCustomer ? {
          name: currentCustomer.name,
          contact: currentCustomer.phone,
          email: currentCustomer.email || '',
        } : undefined,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch(`${BASE_URL}/api/razorpay/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                store_id: localStorage.getItem('userId'),
              }),
            });
  
            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }
  
            onPaymentAmountChange(remainingAmount);
            onAddPayment();
          } catch (err) {
            setError('Payment verification failed. Please try again.');
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
            onPaymentMethodSelect('RAZORPAY');
          },
        },
        theme: {
          color: '#528FF0',
        },
      };
  
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError('Payment initialization failed. Please try again.');
      setPaymentProcessing(false);
      onPaymentMethodSelect('RAZORPAY');
    }
  };

  const handleGetCustomer = async () => {
    try {
      setLoading(true);
      setError('');
      const customer = await royaltyService.getCustomerByPhone(phone);
  
      if (customer) {
        setCurrentCustomer({
          name: customer.name,
          phone: customer.phone,
          royalty_points: customer.royalty_points,
          email: customer.email,
          address: customer.address,
        });
        setName(customer.name);
  
        if (customer.email) {
          onEmailPass(customer.email);
        }
      } else {
        setError('Not a registered customer, click below to add customer.');
        setCurrentCustomer(null);
      }
    } catch (err) {
      setError('Failed to fetch customer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    try {
      setLoading(true);
      setError('');
  
      const newCustomer = await royaltyService.createOrUpdateCustomer({
        name,
        phone,
        email,
        address,
        royalty_points: 0,
        usePoints: true,
      });
  
      setCurrentCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        royalty_points: newCustomer.royalty_points,
      });
  
      if (newCustomer.email) {
        onEmailPass(newCustomer.email);
      }
    } catch (err) {
      setError('Failed to add customer. Please try again.');
      console.error('Error adding customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseRoyaltyPoints = async () => {
    if (!currentCustomer || royaltyPointsUsed) return;

    try {
      setLoading(true);
      const pointsToUse = Math.min(currentCustomer.royalty_points, total);
      const newTotal = total - pointsToUse;

      setDiscountApplied(pointsToUse);

      await royaltyService.createOrUpdateCustomer({
        name: currentCustomer.name,
        phone: currentCustomer.phone,
        royalty_points: currentCustomer.royalty_points - pointsToUse,
        usePoints: true,
        pointsUsed: pointsToUse,
      });

      setCurrentCustomer(prev => prev ? { ...prev, royalty_points: prev.royalty_points - pointsToUse } : null);
      onUpdateTotal(newTotal);
      setRoyaltyPointsUsed(true);
      onPaymentAmountChange(newTotal);
    } catch (err) {
      setError('Failed to apply royalty points. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (remainingAmount === 0 && currentCustomer && !pointsAwarded) {
      const pointsToAward = Math.floor(total / 100);
      if (pointsToAward > 0) {
        royaltyService.createOrUpdateCustomer({
          name: currentCustomer.name,
          phone: currentCustomer.phone,
          royalty_points: currentCustomer.royalty_points + pointsToAward,
          usePoints: true,
        }).then(() => {
          setCurrentCustomer(prev => prev ? { ...prev, royalty_points: prev.royalty_points + pointsToAward } : null);
          setPointsAwarded(true);
        }).catch(err => {
          console.error('Error awarding points:', err);
        });
      }
    }
  }, [remainingAmount, total, currentCustomer, pointsAwarded]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Payment Details</h2>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <p className="text-lg font-semibold">Original Amount: ₹{(total + discountApplied).toFixed(2)}</p>
          {discountApplied > 0 && (
            <>
              <p className="text-green-600">Royalty Points Used: {discountApplied}</p>
              <p className="text-green-600">Discount Amount: -₹{discountApplied.toFixed(2)}</p>
            </>
          )}
          <p className="text-lg font-semibold">Final Amount: ₹{total.toFixed(2)}</p>
          <p className="text-md text-gray-600">Remaining: ₹{remainingAmount.toFixed(2)}</p>
        </div>

        {!currentCustomer ? (
          <div className="mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-lg mb-2"
              placeholder="Customer Name"
              disabled={loading}
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Phone Number (required)"
              disabled={loading}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleGetCustomer}
                disabled={loading || !phone}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Get Customer'}
              </button>
              {error && (
                <button
                  onClick={handleAddCustomer}
                  disabled={loading || !name || !phone}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Add Customer'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-md">Name: {currentCustomer.name}</p>
            <p className="text-md">Phone: {currentCustomer.phone}</p>
            <p className="text-md">Royalty Points: {currentCustomer.royalty_points}</p>
            {/* <p className="text-md">Email: {currentCustomer.email}</p> */}

            {currentCustomer.royalty_points > 0 && !royaltyPointsUsed && (
              <button
                onClick={handleUseRoyaltyPoints}
                disabled={loading}
                className="w-full mt-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Use Royalty Points
              </button>
            )}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onPaymentMethodSelect('CASH')}
              disabled={paymentProcessing}
              className={`py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                currentPayment.method === 'CASH'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Banknote className="w-4 h-4" />
              Cash
            </button>
            <button
              onClick={() => onPaymentMethodSelect('UPI')}
              disabled={paymentProcessing}
              className={`py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                currentPayment.method === 'UPI'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Smartphone className="w-4 h-4" />
              UPI
            </button>
            <button
              onClick={() => onPaymentMethodSelect('CARD')}
              disabled={paymentProcessing}
              className={`py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                currentPayment.method === 'CARD'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Card className="w-4 h-4" />
              Card
            </button>
            <button
              onClick={() => {
                onPaymentMethodSelect('RAZORPAY');
                handleRazorpayPayment();
              }}
              disabled={paymentProcessing || !razorpayLoaded}
              className={`py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                currentPayment.method === 'RAZORPAY'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <CreditCard className="w-4 h-4" />
              Online
            </button>
          </div>

          {(currentPayment.method === 'CASH' || currentPayment.method === 'UPI' || currentPayment.method === 'CARD') && (
            <div className="space-y-2">
              <input
                type="number"
                value={currentPayment.amount}
                onChange={(e) => onPaymentAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter amount"
                disabled={loading}
                max={remainingAmount}
              />
              {currentPayment.method === 'UPI' && (
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter UPI ID (optional)"
                  disabled={loading}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBack}
            disabled={loading || paymentProcessing}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Back to Preview
          </button>
          {(currentPayment.method === 'CASH' || currentPayment.method === 'UPI' || currentPayment.method === 'CARD') && (
            <button
              onClick={onAddPayment}
              disabled={loading || remainingAmount === 0 || currentPayment.amount <= 0}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Add Payment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;