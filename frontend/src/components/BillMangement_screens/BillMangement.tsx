import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Printer, Ban } from 'lucide-react';
import PrintReceipt from '../BillmanagePrint';
import BillStats from '../POS_Screens/BillStats';
import CancelBillModal from './CancelBillModal';
import ReportGenerator from './ReportGenerator';
import Pagination from './Pagination';
import { Bill } from '../../types';
import { 
  fetchCancelledBills, 
  cancelBill, 
  calculateBillStats,
  POLLING_INTERVAL_MS} from '../../services/billservice';
import {fetchActiveBills} from '../../services/billservice'; 
import { usePolling } from './usePolling';
// import {fetchCancelledBills} from '../../services/billservice'; 
import ScrollToTopButton from '../SalesReport/ScrollToTopButton';

interface BillManagementProps {
  currentTheme: string;
}

export default function BillManagement({ currentTheme }: BillManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [activeBills, setActiveBills] = useState<Bill[]>([]);
  const [cancelledBills, setCancelledBills] = useState<Bill[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBillForCancel, setSelectedBillForCancel] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'active' | 'cancelled'>('active');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    cancelledOrders: 0,
    cancelledAmount: 0,
    deletedOrders: 0,
    deletedAmount: 0,
  });
  const billsPerPage = 20;

  const updateStats = useCallback(() => {
    const newStats = calculateBillStats(activeBills, cancelledBills);
    setStats(newStats);
  }, [activeBills, cancelledBills]);

  const loadActiveBills = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userID');
      if (!userId) throw new Error('User ID not found in localStorage');
      const bills = await fetchActiveBills(userId);
      
      // Sort the bills by billNumber in descending order
      const sortedBills = bills.sort((a, b) => {
        return parseInt(b.id, 10) - parseInt(a.id, 10); // Assuming 'id' is the bill number
      });
  
      setActiveBills(sortedBills);
    } catch (err) {
      console.error('Error fetching active bills:', err);
    }
  }, []);
  
  const loadCancelledBills = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userID');
      if (!userId) throw new Error('User ID not found in localStorage');
      const bills = await fetchCancelledBills(userId);
  
      // Sort the bills by billNumber in descending order
      const sortedBills = bills.sort((a, b) => {
        return parseInt(b.id, 10) - parseInt(a.id, 10); // Assuming 'id' is the bill number
      });
  
      setCancelledBills(sortedBills);
    } catch (err) {
      console.error('Error fetching cancelled bills:', err);
    }
  }, []);
  

  useEffect(() => {
    updateStats();
  }, [activeBills, cancelledBills, updateStats]);

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([loadActiveBills(), loadCancelledBills()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching bills');
      } finally {
        setIsLoading(false);
      }
    };
    initialLoad();
  }, [loadActiveBills, loadCancelledBills]);

  usePolling(() => {
    Promise.all([loadActiveBills(), loadCancelledBills()]);
  }, POLLING_INTERVAL_MS);

  const handleCancelBill = async (billId: string, reason: string) => {
    try {
      const userId = localStorage.getItem('userID');
      if (!userId) throw new Error('User ID not found');
  
      const username = localStorage.getItem('name');
      const Login_id = localStorage.getItem('licenseId');
      if (!username || !Login_id) throw new Error('Required user details are missing');
  
      const billToCancel = activeBills.find(bill => bill.id === billId);
      if (!billToCancel) throw new Error('Bill not found');
  
      const success = await cancelBill(billId, userId, {
        date: billToCancel.date,
        items: billToCancel.items,
        total: billToCancel.total,
        paymentMethod: billToCancel.paymentMethod,
        reason,
        username, // Pass username here
        Login_id, // Pass Login_id here
      });
  
      if (success) {
        setActiveBills(prev => prev.filter(b => b.id !== billId));
        await loadCancelledBills(); // Reload cancelled bills to get the latest data
        setShowCancelModal(false);
        setViewMode('cancelled');
      }
    } catch (error) {
      console.error('Error cancelling bill:', error);
    }
  };

  const getCurrentBills = useCallback(() => {
    return viewMode === 'active' ? activeBills : cancelledBills;
  }, [viewMode, activeBills, cancelledBills]);

  const filteredBills = getCurrentBills().filter(bill => 
    bill.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log(filteredBills);

  const indexOfLastBill = currentPage * billsPerPage;
  const indexOfFirstBill = indexOfLastBill - billsPerPage;
  const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill);
  const totalPages = Math.ceil(filteredBills.length / billsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
 
  const handlePrint = (bill: Bill) => {
    setSelectedBill(bill);
    console.log(bill);
    setTimeout(() => {
      const printContent = document.getElementById('print-receipt');
      if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Bill Receipt - ${bill.id}</title>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              </head>
              <body>
                ${printContent.innerHTML}
                <script>
                  window.onload = () => {
                    window.print();
                    window.onafterprint = () => window.close();
                  }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    }, 100);
  };

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Bill Management</h1>
        <p className="text-gray-600">Manage and track all your bills</p>
      </div>

      <BillStats stats={stats} currentTheme={currentTheme} />
      
      <ReportGenerator bills={[...activeBills, ...cancelledBills]} currentTheme={currentTheme} />

      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search bills by ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-${currentTheme}-500 focus:border-transparent`}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode('active');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'active'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-300 text-black'
            }`}
          >
            Active Bills ({activeBills.length})
          </button>
          <button
            onClick={() => {
              setViewMode('cancelled');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'cancelled'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-300 text-black'
            }`}
          >
            Cancelled Bills ({cancelledBills.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bills...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-blue-500">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Bill ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                {viewMode === 'cancelled' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Reason
                  </th>
                )}
                {viewMode === 'active' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {viewMode === 'active' ? 'Billed By' : viewMode === 'cancelled' ? 'Cancelled By' : ''}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{bill.id}</td>
                  <td className="px-6 py-4">{formatDate(bill.date)}</td>
                  <td className="px-6 py-4">{bill.items.length} items</td>
                  <td className="px-6 py-4 font-medium">₹{bill.total.toFixed(2)}</td>
                  <td className="px-6 py-4">{bill.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                  </td>
                  {viewMode === 'cancelled' && (
                    <td className="px-6 py-4 text-sm text-gray-600">{bill.cancellationReason || '-'}</td>
                  )}
                  {viewMode === 'active' && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handlePrint(bill)} className={`text-${currentTheme}-600 hover:text-${currentTheme}-900`} title="Print Bill">
                          <Printer className="w-5 h-5" />
                        </button>
                        {bill.status !== 'cancelled' && (
                          <button onClick={() => { setSelectedBillForCancel(bill.id); setShowCancelModal(true); }} className="text-yellow-600 hover:text-yellow-900" title="Cancel Bill">
                            <Ban className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {viewMode === 'active' ? bill.billname : viewMode === 'cancelled' ? bill.cancelled_user : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          currentTheme={currentTheme}
        />
      )}

<div className="hidden">
  <div id="print-receipt">
    {selectedBill && (
      <PrintReceipt
        billNumber={selectedBill.id} // Passing the bill ID as billNumber
        items={selectedBill.items}
        subtotal={selectedBill.subtotal}
        gst={selectedBill.gst}
        gstRate={(selectedBill.gst / selectedBill.subtotal) * 100}
        serviceChargeAmount={selectedBill.serviceChargeAmount}
        serviceCharge={(selectedBill.serviceCharge)}
        paymentmethod={selectedBill.paymentMethod}
        paymentAmount = {selectedBill.splitpayment}
        total={selectedBill.total}
        payments={selectedBill.payments} // If there are payments details
        timestamp={selectedBill.date} // Passing the date as timestamp
      />
    )}
  </div>
</div>


      {showCancelModal && (
        <CancelBillModal
          billId={selectedBillForCancel}
          onCancel={handleCancelBill}
          onClose={() => setShowCancelModal(false)}
        />
      )}
      <ScrollToTopButton />
    </div>
  );
}