import { Bill, BillCancelData, BillStats } from '../types/bills';
import { BASE_URL } from '../services/service';
 
export const POLLING_INTERVAL_MS = 1000;
 


export async function fetchActiveBills(userId: string): Promise<Bill[]> {
  const response = await fetch(`${BASE_URL}/api/bills/details?userId=${userId}`);
 
  if (!response.ok) {
    throw new Error('Failed to fetch bills');
  }
 
  const data = await response.json();
 
  return data.map((bill: any) => {
    const relatedItems = bill.items || [];
    const relatedPayments = bill.payments || [];
 
    // Create a list of payment methods and their amounts
    const payments = relatedPayments.map((payment: any) => ({
      method: payment.method,
      amount: parseFloat(payment.amount),
    }));

    // Join all payment methods and amounts as a string
    const paymentMethodString = payments.map((payment: { method: any; }) => `${payment.method}`).join(', ');
    const paymentAmountsString = payments.map((payment: { amount: number; }) => `₹${payment.amount.toFixed(2)}`).join(', ');

    return {
      id: bill.billNumber?.toString() || 'N/A',
      date: bill.timestamp || 'N/A',
      billname:bill.billed_user,
      items: relatedItems.map((item: any) => ({
        name: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity,
        category: item.category || 'N/A',
        available: item.available || false,
      })),
      subtotal: parseFloat(bill.subtotal) || 0,
      gst: parseFloat(bill.gst) || 0,
      gstRate: parseFloat(bill.gstRate) || 0,
      serviceCharge : parseFloat(bill.serviceCharge) || 0,
      serviceChargeAmount : parseFloat(bill.serviceChargeAmount) || 0,
      total: parseFloat(bill.total) || 0,
      status: 'paid', // Default to 'paid' as the status field isn't present in the response
      paymentMethod: paymentMethodString || 'N/A', // Updated to display all payment methods
      paymentAmount: payments.reduce((sum: any, payment: { amount: any; }) => sum + payment.amount, 0) || 0, // Total payment amount
      splitpayment : paymentAmountsString || 'N/A', 
    };
  });
}


 
 
 
export async function fetchCancelledBills(userId: string): Promise<Bill[]> {
  const response = await fetch(`${BASE_URL}/api/cancelledbills/user/${userId}`);
 
  if (!response.ok) {
    throw new Error('Failed to fetch cancelled bills');
  }
 
  const { data } = await response.json();
 
  // Remove duplicates based on bill ID
  const uniqueBills = data.reduce((acc: any[], bill: any) => {
    if (!acc.find((b: any) => b.billId === bill.billId)) {
      acc.push(bill);
    }
    return acc;
  }, []);
 
  return uniqueBills.map((bill: any) => ({
    id: bill.billId,
    date: bill.date,
    items: bill.items,
    total: parseFloat(bill.total),
    status: 'cancelled',
    cancellationReason: bill.reason,
    paymentMethod: bill.paymentMethod,
    cancelled_user:bill.billed_user,
    cancelBill_user_payload_id:bill.payload_id,
    subtotal: parseFloat(bill.total) / 1.18,
    gst: parseFloat(bill.total) * 0.18
  }));
}
 


export async function cancelBill(billId: string, userId: string, billData: BillCancelData): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/api/cancelledbills/cancel/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: billData.username, // Access username from the passed data
      Login_id: billData.Login_id, // Access Login_id from the passed data
      billId,
      userId,
      reason: billData.reason,
      date: billData.date,
      items: billData.items,
      total: billData.total,
      paymentMethod: billData.paymentMethod,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to cancel bill');
  }

  const result = await response.json();
  return result.success;
}

export function calculateBillStats(activeBills: Bill[], cancelledBills: Bill[]): BillStats {
  const validActiveBills = activeBills.filter(bill => bill.status !== 'cancelled');
  const validCancelledBills = cancelledBills.filter(bill => bill.status === 'cancelled');

  return {
    totalOrders: validActiveBills.length,
    totalAmount: validActiveBills.reduce((sum, bill) => sum + bill.total, 0),
    cancelledOrders: validCancelledBills.length,
    cancelledAmount: validCancelledBills.reduce((sum, bill) => sum + bill.total, 0),
    deletedOrders: 0,
    deletedAmount: 0,
  };
}
