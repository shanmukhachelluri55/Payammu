// orderService.ts
import { BASE_URL } from './service';

export const fetchOrders = async (userId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/bills/activebills?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json();
  
      if (data.payments.length === 0) {
        return []; // Return empty array if no payments
      }
  
      // Transform the data as needed
      return data.payments.map((payment: any) => ({
        bill_number: payment.bill_number,
        created_at: data.items.find((item: any) => item.bill_number === payment.bill_number)?.created_at || '',
        total_amount: parseFloat(payment.amount),
        payment_method: payment.method,
      }));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to fetch data");
    }
  };
  