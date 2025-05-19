import React, { useEffect, useState } from 'react';
import type { CartItem } from '../types';

interface PaymentSplit {
  method: 'CASH' | 'CARD' | 'UPI';
  amount: number;
}

interface PrintReceiptProps {
  billNumber?: number;
  items: CartItem[];
  subtotal: number;
  gst: number;
  gstRate: number;
  serviceChargeAmount: number;
  serviceCharge: number;
  paymentmethod: string; // Payment method as a comma-separated string
  total: number;
  payments?: PaymentSplit[]; // Individual payment details
  timestamp?: string;
  isCompletePayment?: boolean;
  paymentAmount?: string;
}

export default function PrintReceipt({
  billNumber: propsBillNumber,
  items,
  subtotal,
  gst,
  gstRate,
  serviceChargeAmount,
  serviceCharge,
  total,
  payments,
  paymentmethod,
  timestamp,
  isCompletePayment = false,
  paymentAmount,
}: PrintReceiptProps) {
  const [billNumber, setBillNumber] = useState<number>(0);
  const shopName = localStorage.getItem('restaurant') || 'Shop Name';
  const email = localStorage.getItem('email') || 'example@domain.com';
  const address = localStorage.getItem('address') || 'Address not available';
  const gstin = localStorage.getItem('gstin') || 'NA';
  const promoLogoUrl = 'payammu.png'; // Placeholder for promotional logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const logoPath = localStorage.getItem('imageUrl');
    if (logoPath) {
      // Directly use the base64 string (already includes the prefix)
      setLogoUrl(logoPath);
    }
  }, []);

  useEffect(() => {
    const loadBillNumber = async () => {
      try {
        if (propsBillNumber) {
          setBillNumber(propsBillNumber);
        } else {
          const nextBillNumber = await fetchBillNumber();
          setBillNumber(nextBillNumber);
        }
      } catch (error) {
        console.error('Error fetching bill number:', error);
      }
    };

    loadBillNumber();
  }, [propsBillNumber]);

  const currentDateTime = timestamp ? new Date(timestamp) : new Date();
  const isValidDate = !isNaN(currentDateTime.getTime()); // Check if the date is valid

  const formattedDate = isValidDate
    ? currentDateTime.toLocaleDateString()
    : new Date().toLocaleDateString();
  const formattedTime = isValidDate
    ? currentDateTime.toLocaleTimeString()
    : new Date().toLocaleTimeString();

  // Adjust bill number for complete payment
  const displayBillNumber = isCompletePayment ? billNumber - 1 : billNumber;

  // Calculate discount applied as: Subtotal - Final Total
  const discountApplied = subtotal - total;

  return (
    <div
      className="p-4 mx-auto border border-gray-300 rounded-lg"
      style={{
        maxWidth: '80mm', // Thermal printer width
        fontFamily: "'Roboto', sans-serif",
        fontSize: '10px', // Adjusted for thermal print readability
        width: '100%',
      }}
    >
      {/* Header Section */}
      <div className="text-center mb-4">
  {logoUrl && (
    <img
      src={logoUrl}
      alt="Restaurant Logo"
      className="mx-auto mb-2"
      style={{
        display: 'block',
        width: 'auto',
        height: 'auto',
        maxWidth: '150px',  // Adjust this based on your layout needs
        maxHeight: '80px',  // Ensures the logo fits within the space
        objectFit: 'contain',  // Ensures the full logo is displayed
      }}
    />
  )}
  <h1 className="font-bold text-gray-800 text-sm">{shopName}</h1>
  <p className="text-gray-600 text-xs">{address}</p>
  <p className="text-gray-600 text-xs">{email}</p>
  {gstin !== 'NA' && (
    <p className="text-gray-600 text-xs">GSTIN: {gstin}</p>
  )}
  <p className="text-xs text-gray-500 mt-1">Thank you for dining with us!</p>
</div>


      {/* Bill Info Section */}
      <div className="mb-4">
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="text-gray-500">Bill No:</td>
              <td className="text-right font-bold">{displayBillNumber}</td>
            </tr>
            <tr>
              <td className="text-gray-500">Date:</td>
              <td className="text-right font-bold">{formattedDate}</td>
            </tr>
            <tr>
              <td className="text-gray-500">Time:</td>
              <td className="text-right font-bold">{formattedTime}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Items Section */}
      <div className="mb-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b text-gray-700">
              <th className="text-left">Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">₹{parseFloat(item.price).toFixed(2)}</td>
                <td className="text-right">
                  ₹{(item.quantity * parseFloat(item.price)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="border-t border-gray-300 pt-2 text-xs">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="text-gray-600">Subtotal</td>
              <td className="text-right font-bold">₹{subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="text-gray-600">GST ({Math.floor(gstRate)}%)</td>
              <td className="text-right font-bold">₹{gst.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="text-gray-600">Service Charge ({serviceCharge}%)</td>
              <td className="text-right font-bold">₹{serviceChargeAmount.toFixed(2)}</td>
            </tr>

            {/* Discount Applied Section */}
            {discountApplied > 0 && (
              <tr>
                <td className="text-gray-600">Discount Applied</td>
                <td className="text-right font-bold text-green-600">
                  -₹{discountApplied.toFixed(2)}
                </td>
              </tr>
            )}

            <tr className="border-t border-gray-300">
              <td className="font-bold text-sm">Final Total</td>
              <td className="text-right font-bold text-sm">₹{total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Methods */}
      <div className="mt-2 text-xs">
        <h3 className="font-bold text-gray-800 mb-1">Payment Methods</h3>
        <p className="text-gray-600">{paymentmethod}</p>
        {paymentAmount && (
          <p className="text-gray-600">Amounts: ₹{paymentAmount}</p>
        )}
      </div>

      {/* Payment Details Section */}
      {payments && payments.length > 0 && (
        <div className="mt-2">
          <h3 className="font-bold text-gray-800 mb-1">Payment Details</h3>
          {payments.map((payment, index) => (
            <div key={index} className="flex justify-between">
              <span>{payment.method}</span>
              <span>₹{payment.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer Section */}
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Contact us at: {email}</p>
        <p>Visit: {address}</p>
        <p className="font-semibold text-gray-600 mt-1">
          We hope to see you again!
        </p>
      </div>

      {/* Horizontal Rule */}
      <hr className="my-4 border-t border-gray-300" />

      {/* Promotional Logo */}
      <div className="text-center">
        <img
          src={promoLogoUrl}
          alt="Promotional Logo"
          style={{
            width: '80px',
            height: 'auto',
            display: 'inline-block',
            maxWidth: '100%', // Prevent overflow
          }}
        />
      </div>
    </div>
  );
}
