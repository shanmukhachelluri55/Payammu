import { useState, useEffect } from 'react';
import type { Bill, CartItem } from '../types/index1';

export function useBillManagement(initialBill: Bill = {
  id: 1, cart: [], gstRate: 0, serviceCharge: 0,
  discountAmount: 0
}) {
  // Function to load bills and currentBillId from localStorage
  const loadBillsFromStorage = () => {
    const savedBills = localStorage.getItem('bills');
    if (savedBills) {
      const parsedBills = JSON.parse(savedBills);
      return parsedBills.length > 0 ? parsedBills : [initialBill];
    }
    return [initialBill];
  };

  const loadCurrentBillIdFromStorage = () => {
    const savedCurrentBillId = localStorage.getItem('currentBillId');
    if (savedCurrentBillId) {
      const parsedId = JSON.parse(savedCurrentBillId);
      const bills = loadBillsFromStorage();
      return bills.some(bill => bill.id === parsedId) ? parsedId : bills[0].id;
    }
    return initialBill.id;
  };

  // Initialize bills and currentBillId from localStorage or default values
  const [bills, setBills] = useState<Bill[]>(loadBillsFromStorage);
  const [currentBillId, setCurrentBillId] = useState(loadCurrentBillIdFromStorage);
  const [lastUsedId, setLastUsedId] = useState(() => {
    return Math.max(...loadBillsFromStorage().map(bill => bill.id));
  });

  // Update localStorage whenever bills or currentBillId changes
  useEffect(() => {
    localStorage.setItem('bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('currentBillId', JSON.stringify(currentBillId));
  }, [currentBillId]);

  const getNextBillNumber = () => {
    const nextId = lastUsedId + 1;
    setLastUsedId(nextId);
    return nextId;
  };

  const holdBill = () => {
    if (bills.length >= 5) {
      console.warn('Maximum number of bills (5) reached');
      return;
    }

    const nextId = getNextBillNumber();
    const newBill: Bill = {
      id: nextId,
      cart: [],
      gstRate: 0,
      serviceCharge: 0,
      discountAmount: 0
    };

    setBills(prevBills => {
      // Ensure we don't exceed 5 bills
      if (prevBills.length >= 5) return prevBills;
      
      // Check for duplicate IDs (shouldn't happen, but safety check)
      if (prevBills.some(bill => bill.id === nextId)) {
        console.error('Duplicate bill ID detected');
        return prevBills;
      }

      return [...prevBills, newBill];
    });
    setCurrentBillId(nextId);
  };

  const switchToBill = (billId: number) => {
    const billExists = bills.some(bill => bill.id === billId);
    if (billExists) {
      setCurrentBillId(billId);
    } else {
      console.warn('Attempted to switch to non-existent bill:', billId);
    }
  };

  const deleteBill = (billId: number) => {
    setBills(prevBills => {
      const newBills = prevBills.filter(b => b.id !== billId);
      
      // If we're deleting the last bill, create a new one
      if (newBills.length === 0) {
        const nextId = getNextBillNumber();
        const newBill = {
          id: nextId,
          cart: [],
          gstRate: 0,
          serviceCharge: 0,
          discountAmount: 0
        };
        setCurrentBillId(nextId);
        return [newBill];
      }

      // If we're deleting the current bill, switch to the first remaining bill
      if (currentBillId === billId) {
        setCurrentBillId(newBills[0].id);
      }

      return newBills;
    });
  };

  const completeBill = () => {
    setBills(prevBills => {
      const newBills = prevBills.filter(b => b.id !== currentBillId);
      
      // If this was the last bill, create a new one
      if (newBills.length === 0) {
        const nextId = getNextBillNumber();
        const newBill = {
          id: nextId,
          cart: [],
          gstRate: 0,
          serviceCharge: 0,
          discountAmount: 0
        };
        setCurrentBillId(nextId);
        return [newBill];
      }

      // Switch to the first remaining bill
      setCurrentBillId(newBills[0].id);
      return newBills;
    });
  };

  const updateBill = (billId: number, updates: Partial<Bill>) => {
    setBills(prevBills => prevBills.map(bill =>
      bill.id === billId ? { ...bill, ...updates } : bill
    ));
  };

  const addToCart = (billId: number, item: CartItem) => {
    setBills(prevBills => prevBills.map(bill => {
      if (bill.id === billId) {
        const existing = bill.cart.find(i => i.id === item.id);
        if (existing) {
          return {
            ...bill,
            cart: bill.cart.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          };
        }
        return {
          ...bill,
          cart: [...bill.cart, { ...item, quantity: 1 }]
        };
      }
      return bill;
    }));
  };

  const updateQuantity = (billId: number, itemId: string, delta: number) => {
    setBills(prevBills => prevBills.map(bill => {
      if (bill.id === billId) {
        return {
          ...bill,
          cart: bill.cart.map(item => {
            if (item.id === itemId) {
              const newQuantity = item.quantity + delta;
              return newQuantity <= 0 ? null : { ...item, quantity: newQuantity };
            }
            return item;
          }).filter(Boolean) as CartItem[]
        };
      }
      return bill;
    }));
  };

  return {
    bills,
    currentBillId,
    currentBill: bills.find(bill => bill.id === currentBillId) || bills[0],
    holdBill,
    switchToBill,
    deleteBill,
    completeBill,
    updateBill,
    addToCart,
    updateQuantity
  };
}