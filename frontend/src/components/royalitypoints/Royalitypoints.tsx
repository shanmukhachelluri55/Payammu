import React, { useEffect, useState } from 'react';
import { Phone, Award, User, Search, ArrowUpDown, Loader2, BarChart3, Users, Star } from 'lucide-react';
import { BASE_URL } from '../../services/service';

interface Customer {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  email: string | null; // Add email
  address: string | null;
  royalty_points: number;
}

function Royalitypoints() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Customer;
    direction: 'asc' | 'desc';
  } | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
        if (!userId) {
          setError('User ID not found');
          setLoading(false);
          return;
        }
  
        const response = await fetch(`${BASE_URL}/api/royalty/getcustomerdetails/${userId}`); 
        const data = await response.json();
        
        if (data.message === "Customers found") {
          setCustomers(data.customers);
          setFilteredCustomers(data.customers);
        } else {
          setError('No customers found');
        }
      } catch (err) {
        setError('Failed to fetch customer details');
      } finally {
        setLoading(false);
      }
    };
  
    fetchCustomers();
  }, []);
  

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) || // Check if email exists
      (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase())) // Check if address exists
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleSort = (key: keyof Customer) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
  
    setSortConfig({ key, direction });
  
    const sorted = [...filteredCustomers].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  
    setFilteredCustomers(sorted);
  };

  const getTotalPoints = () => {
    return customers.reduce((sum, customer) => sum + customer.royalty_points, 0);
  };

  const getAveragePoints = () => {
    return customers.length ? Math.round(getTotalPoints() / customers.length) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <div className="text-xl font-medium text-gray-900">Loading customer data...</div>
            <p className="text-gray-500">Please wait while we fetch the latest information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-md w-full">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Error Loading Data</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
  <div className="max-w-7xl mx-auto p-4">
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
    
    {/* Title & Description */}
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Customer Royalty Dashboard</h1>
      <p className="text-sm text-gray-500 mt-1">Manage and track customer loyalty points</p>
    </div>

    {/* Stats Overview */}
    <div className="grid grid-cols-3 gap-3">
      {/* Card 1 */}
      <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
        <p className="text-xs text-gray-500">Total Customers</p>
        <p className="text-xl font-bold text-gray-900">{customers.length}</p>
      </div>

      {/* Card 2 */}
      <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
        <p className="text-xs text-gray-500">Total Points</p>
        <p className="text-xl font-bold text-gray-900">{getTotalPoints()}</p>
      </div>

      {/* Card 3 */}
      <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
        <p className="text-xs text-gray-500">Average Points</p>
        <p className="text-xl font-bold text-gray-900">{getAveragePoints()}</p>
      </div>
    </div>

  </div>
</div>


      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-9 pr-2 py-1.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm text-transform uppercase font-semibold">
            <tr>
              {["S.No", "Name", "Phone", "Email", "Address", "Royalty Points"].map((col, idx) => (
                <th key={idx} className="px-4 py-2 border-r last:border-none text-center cursor-pointer hover:bg-indigo-700 transition"
                  onClick={() => handleSort(col.toLowerCase().replace(" ", "_"))}>
                  <div className="flex items-center justify-center">
                    {col}
                    {sortConfig?.key === col.toLowerCase().replace(" ", "_") && (
                      <ArrowUpDown className="inline-block h-3 w-3 ml-1" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-200">
            {filteredCustomers.map((customer, index) => (
              <tr key={customer.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2 text-center border-r">{index + 1}</td>
                <td className="px-4 py-2 text-center border-r">{customer.name}</td>
                <td className="px-4 py-2 text-center border-r">{customer.phone}</td>
                <td className="px-4 py-2 text-center border-r">
                  {customer.email ? customer.email : "NA"} {/* Show "NA" if email is null */}
                </td>
                <td className="px-4 py-2 text-center border-r">
                  {customer.address ? customer.address : "NA"} {/* Show "NA" if address is null */}
                </td>
                <td className="px-4 py-2 text-center">
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">
                    {customer.royalty_points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* No Results Found */}
        {filteredCustomers.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <Search className="h-8 w-8 text-gray-400 mx-auto" />
            <h3 className="text-sm font-semibold text-gray-900 mt-2">No Results Found</h3>
            <p className="text-xs text-gray-600">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
}

export default Royalitypoints;