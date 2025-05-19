import { FileStack } from 'lucide-react';
import type { Bill } from '../../types/index1';

interface BillTabsProps {
  bills: Bill[];
  currentBillId: number;
  currentTheme: string;
  onSwitchBill: (id: number) => void;
  onDeleteBill: (id: number) => void;
}

export default function BillTabs({ 
  bills, 
  currentBillId, 
  currentTheme,
  onSwitchBill,
  onDeleteBill 
}: BillTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {[...bills].sort((a, b) => a.id - b.id).map(bill => (
        <button
          key={bill.id}
          onClick={() => onSwitchBill(bill.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold min-w-[120px] transition-all duration-200 ${
            currentBillId === bill.id
              ? 'bg-blue-600 text-white shadow-lg transform scale-105' // Fixed background color
              : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow'
          }`}
        >
          <FileStack className={`w-4 h-4 ${currentBillId === bill.id ? 'text-white' : 'text-blue-600'}`} />
          <span className="flex-1">Bill #{bill.id}</span>
          {bills.length > 1 && currentBillId !== bill.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBill(bill.id);
              }}
              className="ml-auto text-gray-500 hover:text-red-500 transition-colors duration-200"
            >
              ×
            </button>
          )}
        </button>
      ))}
    </div>
  );
}
