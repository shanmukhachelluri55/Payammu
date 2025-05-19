import { useState } from 'react';
import { FileDown } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import { Bill } from '../../types';

interface ReportGeneratorProps {
  bills: Bill[];
  currentTheme: string;
}

export default function ReportGenerator({ bills, currentTheme }: ReportGeneratorProps) {
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [filteredBills, setFilteredBills] = useState<{
    active: Bill[];
    cancelled: Bill[];
  }>({ active: [], cancelled: [] });

  const handleDateChange = (start: Date, end: Date) => {
    const adjustedEnd = new Date(end);
    adjustedEnd.setHours(23, 59, 59, 999);

    const filtered = bills.reduce(
      (acc, bill) => {
        const billDate = new Date(bill.date);
        if (billDate >= start && billDate <= adjustedEnd) {
          if (bill.status === 'cancelled') {
            acc.cancelled.push(bill);
          } else {
            acc.active.push(bill);
          }
        }
        return acc;
      },
      { active: [] as Bill[], cancelled: [] as Bill[] }
    );

    setDateRange({ start, end });
    setFilteredBills(filtered);
  };

  const generateReport = () => {
    if (!dateRange.start || !dateRange.end) return;

    const allBills = [...filteredBills.active, ...filteredBills.cancelled];
    const csvContent = [
      ['Bill ID', 'Date', 'Status', 'Items', 'Total', 'Cancellation Reason'],
      ...allBills.map((bill) => [
        bill.id,
        new Date(bill.date).toLocaleDateString(),
        bill.status,
        bill.items.length,
        bill.total.toFixed(2),
        bill.cancellationReason || '-',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills-report-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end
      .toISOString()
      .split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const BillTable = ({ bills, title }: { bills: Bill[]; title: string }) => (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">
        {title} ({bills.length})
      </h3>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Bill ID
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Items
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              {title === 'Cancelled Bills' && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{bill.id}</td>
                <td className="px-4 py-2">{formatDate(bill.date)}</td>
                <td className="px-4 py-2">{bill.items.length} items</td>
                <td className="px-4 py-2">₹{bill.total.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bill.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : bill.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                  </span>
                </td>
                {title === 'Cancelled Bills' && (
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {bill.cancellationReason || '-'}
                  </td>
                )}
              </tr>
            ))}
            {bills.length === 0 && (
              <tr>
                <td
                  colSpan={title === 'Cancelled Bills' ? 6 : 5}
                  className="px-4 py-4 text-center text-gray-500"
                >
                  No bills found for the selected date range
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Bill Reports</h2>
        <div className="flex items-center justify-between">
          <DateRangePicker onDateChange={handleDateChange} />
          <button
            onClick={generateReport}
            disabled={!dateRange.start || !dateRange.end}
            className={`flex items-center px-4 py-2 rounded-lg shadow-md ${
              dateRange.start && dateRange.end
                ? `bg-${currentTheme}-500 hover:bg-${currentTheme}-600 text-white`
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            style={{
              backgroundColor: dateRange.start && dateRange.end ? currentTheme : '#d1d5db',
              color: dateRange.start && dateRange.end ? '#ffffff' : '#6b7280',
            }}
          >
            <FileDown className="w-5 h-5 mr-2" />
            Download Report
          </button>
        </div>
      </div>

      {dateRange.start && dateRange.end && (
        <div className="mt-6">
          <BillTable bills={filteredBills.active} title="Active Bills" />
          <BillTable bills={filteredBills.cancelled} title="Cancelled Bills" />
        </div>
      )}
    </div>
  );
}
