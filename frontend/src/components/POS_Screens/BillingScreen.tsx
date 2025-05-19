import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Save, Search, AlertCircle } from 'lucide-react';
import { fetchItems, fetchBillNumber, getCurrentBillNumber, incrementBillNumber, saveBill, sendReceipt } from '../../services/service';
import type { Item, PaymentSplit, SaleData } from '../../types';
import PrintReceipt from '../PrintReceipt';
import PreviewReceipt from '../PrintReceipt';
import BillTabs from './BillTabs';
import { useBillManagement } from '../../hooks/useBillManagement';
import { PaymentModal } from './PaymentModal';
import { CartSection } from './CartSection';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CircularProgress } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



interface BillingScreenProps {
  onCompleteSale: (sale: SaleData) => void;
  currentTheme: 'indigo' | 'emerald' | 'rose' | 'amber';
}

const getPaymentMethodDisplay = (method: string): string => {
  const methodMap: Record<string, string> = {
    'CASH': 'Cash',
    'RAZORPAY': 'Online',
    'UPI': 'UPI',
    'CARD':'CARD'
  };

  const normalizedMethod = method.trim().toUpperCase();
  return methodMap[normalizedMethod] || 'Online';
};

export default function BillingScreen({ onCompleteSale, currentTheme }: BillingScreenProps) {
  const {
    bills,
    currentBillId,
    currentBill,
    holdBill,
    switchToBill,
    deleteBill,
    completeBill,
    updateBill,
    addToCart,
    updateQuantity
  } = useBillManagement();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showPreviewReceipt, setShowPreviewReceipt] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [currentPayment, setCurrentPayment] = useState<PaymentSplit>({ method: 'CASH', amount: 0 });
  const [completedSale, setCompletedSale] = useState<SaleData | null>(null);
  const [currentBillNumber, setCurrentBillNumber] = useState<number>(1);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [customerEmail, setCustomerEmail] = useState(''); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userID');

    const getItems = async () => {
      try {
        const itemsData = await fetchItems(userId ? userId : '');
        const availableItems = itemsData.filter((item) => item.available);
        setItems(availableItems);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    getItems();
  }, []);

  useEffect(() => {
    const loadBillNumber = async () => {
      try {
        const billNumber = await fetchBillNumber();
        setCurrentBillNumber(billNumber);
      } catch (error) {
        console.error("Error fetching bill number:", error);
        setCurrentBillNumber(1);
      }
    };
    loadBillNumber();
  }, []);

  const handleShareReceipt = async () => {
    if (!receiptRef.current || !customerEmail) {
      toast.error('No receipt content or email address found.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
  
    setLoading(true); // Start loading
  
    try {
      const doc = new jsPDF();
      const canvas = await html2canvas(receiptRef.current);
      const imgData = canvas.toDataURL('image/png');
  
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
      const pdfBlob = doc.output('blob');
  
      await sendReceipt(pdfBlob, customerEmail, completedSale.billNumber);
      toast.success('Receipt sent successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      console.error('Error generating or sending PDF:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setLoading(false); // Stop loading
    }
  };
  

 

  const handleEmailPass = (email: string) => {
    console.log('Email passed from PaymentModal:', email); // Log the email
    setCustomerEmail(email); // Update the email state in the parent component
  };

  const categories = useMemo(() => ['all', ...Array.from(new Set(items.map(item => item.category)))], [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleAddToCart = (item: Item) => {
    addToCart(currentBillId, { ...item, quantity: 1 });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    updateQuantity(currentBillId, itemId, delta);
  };

  const subtotal = currentBill.cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const gstAmount = (subtotal * currentBill.gstRate) / 100;
  const serviceChargeAmount = (subtotal * currentBill.serviceCharge) / 100;
  const totalBeforeDiscount = subtotal + gstAmount + serviceChargeAmount;
  const total = totalBeforeDiscount - discountAmount;

  const handlePaymentMethodSelect = (method: 'CASH' | 'RAZORPAY' | 'UPI') => {
    setCurrentPayment({ ...currentPayment, method });
  };

  const handlePaymentAmountChange = (amount: number) => {
    setCurrentPayment({ ...currentPayment, amount });
  };

  const handleUpdateTotal = (newTotal: number) => {
    const newDiscountAmount = totalBeforeDiscount - newTotal;
    setDiscountAmount(newDiscountAmount);
    setRemainingAmount(newTotal);
  };

  const initializePayment = () => {
    if (currentBill.cart.length === 0) {
      alert("No items have been added to this current order.");
      return;
    }
    setShowPreviewReceipt(true);
  };

  const handleConfirmPreview = () => {
    setShowPreviewReceipt(false);
    setRemainingAmount(total);
    setPayments([]);
    setCurrentPayment({ method: 'CASH', amount: total });
    setShowPaymentModal(true);
  };

  const handleAddPayment = async () => {
    if (currentPayment.amount <= 0 || currentPayment.amount > remainingAmount) {
      alert('Invalid payment amount');
      return;
    }

    const newPayments = [...payments, currentPayment];
    const newRemainingAmount = remainingAmount - currentPayment.amount;
    setPayments(newPayments);
    setRemainingAmount(newRemainingAmount);

    if (newRemainingAmount === 0) {
      handleFinalizePayment(newPayments);
    } else {
      setCurrentPayment({ method: 'UPI', amount: newRemainingAmount });
    }
  };

  const handleFinalizePayment = async (finalPayments: PaymentSplit[]) => {
    if (!currentBill.cart.length) {
      alert('No items in cart');
      return;
    }

    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    try {
      const billNumber = getCurrentBillNumber();
      const userID = localStorage.getItem('userID');
      const Payload_id = localStorage.getItem('licenseId');
      const Billed_user = localStorage.getItem('name');

      if (!userID) {
        alert('User is not logged in. Please log in again.');
        return;
      }

      const saleData: SaleData = {
        billNumber,
        items: currentBill.cart.map(item => ({
          ...item,
          itemName: `${item.name} ${item.subVariant ? `(${item.subVariant})` : ''}`.trim()
        })),
        subtotal,
        gst: gstAmount,
        gstRate: currentBill.gstRate,
        serviceCharge: currentBill.serviceCharge,
        serviceChargeAmount,
        totalBeforeDiscount,
        discountAmount,
        total,
        payments: finalPayments.map(payment => ({
          ...payment,
          method: payment.method
        })),
        timestamp,
        userID: parseInt(userID, 10),
        Billed_user,
        Payload_id,
      };

      await saveBill(saleData);
      const nextBillNumber = incrementBillNumber();
      setCurrentBillNumber(nextBillNumber);

      setCompletedSale(saleData);
      onCompleteSale(saleData);
      setPayments(finalPayments);
      completeBill();

      setDiscountAmount(0);
      setRemainingAmount(0);
      setShowPaymentModal(false);
      setShowPrintPreview(true);

    } catch (error) {
      console.error('Error finalizing payment:', error);
      alert('Failed to complete payment. Please try again.');
    }
  };

  return (
    <div className={`flex h-screen bg-${currentTheme}-50`}>
      <div className="flex-1 p-3 overflow-hidden">
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-${currentTheme}-500 focus:border-transparent`}
              />
            </div>

            <button
              onClick={holdBill}
              disabled={bills.length >= 5}
              className={`px-1 py-1.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg transform transition-all duration-200 ${
                bills.length >= 5
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed opacity-50"
                  : `bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl active:scale-95 ring-2 ring-blue-600 ring-opacity-50`
              }`}
            >
              <Save className="w-5 h-5" /> Hold Bill
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 rounded-lg font-semibold transition-all duration-200 ease-in-out ${
                  selectedCategory === category
                    ? `bg-black text-white`
                    : `bg-white text-${currentTheme}-600 hover:bg-${currentTheme}-100 hover:shadow-md`
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          <BillTabs
            bills={bills}
            currentBillId={currentBillId}
            currentTheme={currentTheme}
            onSwitchBill={switchToBill}
            onDeleteBill={deleteBill}
          />
        </div>

        <div
  className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 overflow-y-auto p-2"
  style={{ maxHeight: "calc(100vh - 180px)" }}
>
  {filteredItems.map((item) => {
    const isOutOfStock = item.stockPosition === 0;

    return (
      <button
        key={item.id}
        onClick={() => !isOutOfStock && handleAddToCart(item)}
        className={`relative rounded-md shadow-sm hover:shadow-md transition-all duration-300 group border ${
          isOutOfStock ? "border-red-500 bg-red-100 opacity-75 cursor-not-allowed" : "bg-white"
        } p-1`}
        disabled={isOutOfStock}
      >
        {/* Image Section */}
        <div className="w-full h-24 flex justify-center relative">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />

          {/* Low Stock Alert */}
          {item.stockPosition !== undefined && item.minStock !== undefined && item.stockPosition < item.minStock && (
            <div className="absolute top-1 right-1 bg-red-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-md">
              <AlertCircle className="w-3 h-3" />
              <span>{isOutOfStock ? "Out of Stock" : `Stock: ${item.stockPosition}`}</span>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-semibold text-xs rounded-md">
              Out of Stock
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="p-1 bg-gray-50 text-center rounded-md">
          <h3 className="font-medium text-gray-900 text-xs truncate">{item.name}</h3>

          {item.subVariant && (
            <span className="inline-block bg-blue-500 text-white text-[10px] font-semibold rounded-full px-1 py-0.5 mt-0.5">
              {item.subVariant}
            </span>
          )}

  <p className={`text-${currentTheme}-600 font-bold text-xs mt-0.5 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)] drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]`}>
    ₹{parseFloat(item.price).toFixed(2)}
  </p>

        </div>

        {/* Hover Effect for Add Button */}
        {!isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 group-hover:bg-opacity-60 rounded-md transition-all duration-300 opacity-0 group-hover:opacity-100">
            <div className="bg-white rounded-full p-2 flex items-center justify-center">
              <span className="text-black text-sm font-bold">+</span>
            </div>
          </div>
        )}
      </button>
    );
  })}
</div>
      </div>

      <CartSection
        currentBillNumber={currentBillNumber}
        cart={currentBill.cart}
        gstRate={currentBill.gstRate}
        serviceCharge={currentBill.serviceCharge}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateGstRate={(rate) => updateBill(currentBillId, { gstRate: rate })}
        onUpdateServiceCharge={(rate) => updateBill(currentBillId, { serviceCharge: rate })}
        onInitializePayment={initializePayment}
        onUpdateDiscount={setDiscountAmount}
        totalOriginalAmount={totalBeforeDiscount}
      />

      {showPreviewReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[600px] max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Preview Receipt</h2>
            <div ref={receiptRef}>
              <PreviewReceipt
                items={currentBill.cart}
                subtotal={subtotal}
                gst={gstAmount}
                gstRate={currentBill.gstRate}
                serviceCharge={currentBill.serviceCharge}
                serviceChargeAmount={serviceChargeAmount}
                totalBeforeDiscount={totalBeforeDiscount}
                discountAmount={discountAmount}
                total={total}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPreviewReceipt(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Edit Order
              </button>
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow && receiptRef.current) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Receipt Preview</title>
                          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                        </head>
                        <body>
                          <div id="receipt">
                            ${receiptRef.current.innerHTML}
                          </div>
                          <script>
                            window.onload = () => {
                              window.print();
                              window.onafterprint = () => window.close();
                            };
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Print Preview
              </button>
              <button
                onClick={handleConfirmPreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          total={total}
          remainingAmount={remainingAmount}
          currentPayment={currentPayment}
          payments={payments}
          onPaymentMethodSelect={handlePaymentMethodSelect}
          onPaymentAmountChange={handlePaymentAmountChange}
          onUpdateTotal={handleUpdateTotal}
          onAddPayment={handleAddPayment}
          onBack={() => {
            setShowPaymentModal(false);
            setShowPreviewReceipt(true);
          }}
          onEmailPass={handleEmailPass} // Pass the callback
        />
      )}

      {showPrintPreview && completedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-auto">
            <div id="receipt-content" ref={receiptRef}>
              <PrintReceipt
                billNumber={completedSale.billNumber}
                items={completedSale.items}
                subtotal={completedSale.subtotal}
                gst={completedSale.gst}
                gstRate={completedSale.gstRate}
                serviceCharge={completedSale.serviceCharge}
                serviceChargeAmount={completedSale.serviceChargeAmount}
                totalBeforeDiscount={completedSale.totalBeforeDiscount}
                discountAmount={completedSale.discountAmount}
                total={completedSale.total}
                payments={completedSale.payments.map(payment => ({
                  ...payment,
                  method: getPaymentMethodDisplay(payment.method)
                }))}
                timestamp={completedSale.timestamp}
                userID={completedSale.userID}
                Billed_user={completedSale.Billed_user}
              />
            </div>
            <div className="flex justify-end gap-2 p-4">
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow && receiptRef.current) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Receipt</title>
                          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                        </head>
                        <body>
                          <div id="receipt">
                            ${receiptRef.current.innerHTML}
                          </div>
                          <script>
                            window.onload = () => {
                              window.print();
                              window.onafterprint = () => window.close();
                            };
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Print Receipt
              </button>
              <button
  onClick={handleShareReceipt}
  disabled={loading} // Disable the button while loading
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
>
  {loading ? (
    <CircularProgress size={24} color="inherit" /> // Show spinner while loading
  ) : (
    'Share via Email'
  )}
</button>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}