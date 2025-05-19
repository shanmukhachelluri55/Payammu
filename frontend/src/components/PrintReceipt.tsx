import { useEffect, useState } from 'react';
import type { CartItem } from '../types';
import { fetchBillNumber } from '../services/service';

interface PaymentSplit {
  method: 'CASH' | 'RAZORPAY' | 'UPI';
  amount: number;
}

const getPaymentMethodDisplay = (method: string): string => {
  const methodMap: Record<string, string> = {
    'CASH': 'Cash',
    'ONLINE': 'Online',
    'UPI': 'UPI'
  };
  return methodMap[method] || method;
};

interface PrintReceiptProps {
  billNumber?: number;
  items: CartItem[];
  subtotal: number;
  gst: number;
  gstRate: number;
  serviceChargeAmount: number;
  serviceCharge: number;
  totalBeforeDiscount: number;
  discountAmount: number;
  total: number;
  payments?: PaymentSplit[];
  timestamp?: string;
  userID?: number;
  Billed_user?: string;
  isCompletePayment?: boolean;
}

export default function PrintReceipt({
  billNumber: propsBillNumber,
  items,
  subtotal,
  gst,
  gstRate,
  serviceChargeAmount,
  serviceCharge,
  totalBeforeDiscount,
  discountAmount,
  total,
  payments,
  timestamp,
  userID,
  Billed_user,
  isCompletePayment = false
}: PrintReceiptProps) {
  const [billNumber, setBillNumber] = useState<number>(0);
  const shopName = localStorage.getItem('restaurant') || 'Shop Name';
  const email = localStorage.getItem('email') || 'example@domain.com';
  const address = localStorage.getItem('address') || 'Address not available';
  const phone = localStorage.getItem('phoneNumber') || 'phoneNumber not available';
  const gstin = localStorage.getItem('gstin') || 'NA';
  const promoLogoUrl = '/payammu.png';
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const logoPath = localStorage.getItem('imageUrl');
    if (logoPath) {
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
  const isValidDate = !isNaN(currentDateTime.getTime());

  const formattedDate = isValidDate ? currentDateTime.toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const formattedTime = isValidDate ? currentDateTime.toLocaleTimeString('en-IN') : new Date().toLocaleTimeString('en-IN');

  const displayBillNumber = isCompletePayment ? billNumber - 1 : billNumber;

  return (
    <div
      className="relative p-4 mx-auto border border-gray-300 rounded-lg bg-white"
      style={{
        maxWidth: "80mm",
        fontFamily: "'Courier New', monospace",
        fontSize: "10px",
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Watermark */}
      <div
        className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-10 pointer-events-none"
        style={{
          zIndex: 0,
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#1a1a1a",
          transform: "rotate(-30deg)",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {shopName}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-4">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Restaurant Logo"
              className="mx-auto mb-2"
              style={{
                display: "block",
                width: "auto",
                height: "auto",
                maxWidth: "150px",
                maxHeight: "80px",
                objectFit: "contain",
              }}
            />
          )}
          <h1 className="font-bold text-gray-900 text-lg">{shopName}</h1>
          <p className="font-semibold text-gray-900 text-xs">Contact(+91): {phone}</p>
          <p className="font-semibold text-gray-900 text-xs">{email}</p>
          {gstin !== "NA" && <p className="font-semibold text-gray-900 text-xs">GSTIN: {gstin}</p>}
        </div>

        {/* Bill Info Section */}
        <div className="mb-4">
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="font-bold text-gray-900" style={{ color: "#000000" }}>Bill No:</td>
                <td className="text-right font-bold text-gray-900">{displayBillNumber}</td>
              </tr>
              <tr>
                <td className="font-bold text-gray-900" style={{ color: "#000000" }}>Date:</td>
                <td className="text-right font-bold text-gray-900" style={{ color: "#000000" }}>{formattedDate}</td>
              </tr>
              <tr>
                <td className="font-bold text-gray-900" style={{ color: "#000000" }}>Time:</td>
                <td className="text-right font-bold text-gray-900" style={{ color: "#000000" }}>{formattedTime}</td>
              </tr>
              {Billed_user && (
                <tr>
                  <td className="font-bold text-gray-900" style={{ color: "#000000" }}>Billed By:</td>
                  <td className="text-right font-bold text-gray-900" style={{ color: "#000000" }}>{Billed_user}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Items Section */}
        <div className="mb-4">
  <table
    className="w-full text-xs border-collapse"
    style={{ borderTop: "1px dashed black", borderBottom: "1px dashed black" }}
  >
    <thead>
      <tr
        className="text-gray-900"
        style={{ borderBottom: "1px dashed black" }}
      >
        <th className="text-left font-bold py-1" style={{ color: "#000000" }}>Item</th>

        <th className="text-right font-bold py-1" style={{ color: "#000000" }}>Qty</th>
        <th className="text-right font-bold py-1" style={{ color: "#000000" }}>Price</th>
        <th className="text-right font-bold py-1" style={{ color: "#000000" }}>Total</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr
          key={item.id}
          className="text-gray-900 font-bold"
          style={{ borderBottom: "1px dashed black" }}
        >
          <td className="py-1">
            {item.name}
            {item.subVariant && (
              <span className="text-xs block font-bold" style={{ color: "#000000" }}>
                Variant: {item.subVariant}
              </span>
            )}
          </td>
          <td className="text-right py-1 font-bold" style={{ color: "#000000" }}>{item.quantity}</td>
          <td className="text-right py-1 font-bold" style={{ color: "#000000" }}>
            ₹{parseFloat(item.price).toFixed(2)}
          </td>
          <td className="text-right py-1 font-bold" style={{ color: "#000000" }}>
            ₹{(item.quantity * parseFloat(item.price)).toFixed(2)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


        {/* Summary Section */}
        <div className="text-xs">
  <table className="w-full">
    <tbody>
      <tr style={{ borderBottom: "1px dashed black" }}>
        <td className="font-bold text-gray-800 py-1" style={{ color: "#000000" }}>Subtotal</td>
        <td className="text-right font-bold text-gray-900 py-1" style={{ color: "#000000" }}>
          ₹{subtotal.toFixed(2)}
        </td>
      </tr>
      {gstRate > 0 && (
        <tr style={{ borderBottom: "1px dashed black" }}>
          <td className="font-bold text-gray-800 py-1" style={{ color: "#000000" }}>
            GST ({gstRate}%)
          </td>
          <td className="text-right font-bold text-gray-900 py-1" style={{ color: "#000000" }}>
            ₹{gst.toFixed(2)}
          </td>
        </tr>
      )}
      {serviceCharge > 0 && (
        <tr style={{ borderBottom: "1px dashed black" }}>
          <td className="font-bold text-gray-800 py-1" style={{ color: "#000000" }}>
            Service Charge ({serviceCharge}%)
          </td>
          <td className="text-right font-bold text-gray-900 py-1" style={{ color: "#000000" }}>
            ₹{serviceChargeAmount.toFixed(2)}
          </td>
        </tr>
      )}
      {discountAmount > 0 && (
        <tr style={{ borderBottom: "1px dashed black" }}>
          <td className="font-bold text-gray-800 py-1" style={{ color: "#000000" }}>Discount Applied</td>
          <td className="text-right font-bold text-green-800 py-1" style={{ color: "#000000" }}>
            -₹{discountAmount.toFixed(2)}
          </td>
        </tr>
      )}
      <tr
        style={{
          borderTop: "1px dashed black",
          borderBottom: "1px dashed black",
        }}
      >
        <td className="font-bold text-sm text-gray-900 py-2" style={{ color: "#000000" }}>Final Total</td>
        <td className="text-right font-bold text-sm text-gray-900 py-2" style={{ color: "#000000" }}>
          ₹{total.toFixed(2)}
        </td>
      </tr>
    </tbody>
  </table>
</div>


        {/* Payment Details Section */}
        {payments && payments.length > 0 && (
          <div className="mt-2 text-xs">
            <h3 className="font-bold text-gray-900" style={{ color: "#000000" }}>Payment Details</h3>
            {payments.map((payment, index) => (
              <div key={index} className="flex justify-between text-gray-900 font-bold" style={{ color: "#000000" }}>
                <span>{payment.method}</span>
                <span>₹{payment.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Section */}
        <div className="mt-4 text-center text-xs text-gray-800 pt-4" style={{ color: "#000000", borderTop: "1px dashed black" }}>
        <p className="font-bold" style={{ color: "#000000" }}>Address : {address}</p>
          <p className="font-bold text-gray-900 text-sm" style={{ color: "#000000" }}>Thank You, visit again!</p>
        </div>

        <hr className="my-4 border-t border-gray-300" style={{
          borderTop: "1px dashed black", color: "#000000"
        }} />

        {/* Promotional Logo */}
        <div className="text-center">
  <img
    src={promoLogoUrl}
    alt="Promotional Logo"
    style={{
      width: "80px",
      height: "auto",
      display: "inline-block",
      maxWidth: "100%",
      filter: "brightness(0) contrast(200%)", // Makes the image darker and increases contrast
    }}
  />
</div>
      </div>
    </div>
  );
}