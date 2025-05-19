import { useState } from 'react';
import { X, Calendar, User, AlertCircle, Trash2, Filter } from 'lucide-react';
import { Bill } from '../../types';

interface CancelledBillsModalProps {
  bills: Bill[];
  onClose: () => void;
}

export default function CancelledBillsModal({ bills, onClose }: CancelledBillsModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAndSortedBills = bills
    .filter(bill => {
      if (!startDate && !endDate) return true;
      const billDate = new Date(bill.date);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      return billDate >= start && billDate <= end;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const totalLostRevenue = filteredAndSortedBills.reduce((sum, bill) => sum + bill.total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Cancelled & Deleted Bills Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-md px-3 py-2"
              />
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <Filter className="w-4 h-4 mr-2" />
              {sortOrder === 'asc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredAndSortedBills.length} bills | Total Lost Revenue: ₹{totalLostRevenue.toFixed(2)}
          </div>
        </div>
        
        <div className="space-y-6">
          {filteredAndSortedBills.map((bill) => (
            <div
              key={bill.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold">Bill #{bill.id}</h3>
                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                      bill.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(bill.date)}
                  </div>
                  {bill.customerName && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <User className="w-4 h-4 mr-1" />
                      {bill.customerName}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold">₹{bill.total.toFixed(2)}</span>
                  <p className="text-sm text-gray-600">{bill.items.length} items</p>
                </div>
              </div>
              
              {bill.cancellationReason && (
                <div className="border-t pt-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Reason:</p>
                      <p className="text-gray-600 mt-1">{bill.cancellationReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}