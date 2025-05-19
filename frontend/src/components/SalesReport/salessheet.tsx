import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import axios from 'axios';
import { groupBy } from 'lodash';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { utils, writeFile } from 'xlsx';
import {
  ChartBarIcon,
  CalendarIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import { BASE_URL } from '../../services/service';
import ScrollToTopButton from './ScrollToTopButton'; 

// Move interfaces outside of component
interface Item {
  id: number;
  bill_number: number;
  user_id: number;
  name: string;
  subvariant: string;
  price: string;
  category: string;
  available: boolean;
  quantity: number;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: number;
  bill_number: number;
  user_id: number;
  method: string;
  amount: string;
}

interface ApiResponse {
  items: Item[];
  payments: Payment[];
}

interface DailySummary {
  date: string;
  totalSales: number;
  totalItems: number;
  totalOrders: number;
  paymentMethods: { [key: string]: number };
  itemsSold: { [key: string]: number };
}

// Move constants outside of component
const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

const tabVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

function App() {
  // Group all useState hooks together at the top
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'items' | 'payments'>('overview');
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  // Move data processing functions outside of render
  const processItemsByDate = useCallback((items: Item[], payments: Payment[]) => {
    const itemsByDate = groupBy(items, item => 
      format(parseISO(item.created_at), 'yyyy-MM-dd')
    );

    return Object.keys(itemsByDate).map(date => {
      const dayItems = itemsByDate[date];
      const dayPayments = payments.filter(payment => 
        dayItems.some(item => item.bill_number === payment.bill_number)
      );
      
      const paymentMethods = dayPayments.reduce((acc: { [key: string]: number }, payment) => {
        acc[payment.method] = (acc[payment.method] || 0) + parseFloat(payment.amount);
        return acc;
      }, {});

      const itemsSold = dayItems.reduce((acc: { [key: string]: number }, item) => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity;
        return acc;
      }, {});

      return {
        date,
        totalSales: dayPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0),
        totalItems: dayItems.reduce((sum, item) => sum + item.quantity, 0),
        totalOrders: new Set(dayItems.map(item => item.bill_number)).size,
        paymentMethods,
        itemsSold
      };
    });
  }, []);

  // useEffect hook
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId'); // Get userId from localStorage

        if (!userId) {
          throw new Error('User ID not found in localStorage');
        }

        const response = await axios.get(`${BASE_URL}/api/bills/activebills`, {
          params: { userId: Number(userId) } // Convert userId to a number
        });

        if (!response.data || !response.data.items || !response.data.payments) {
          throw new Error('Invalid data format received from API');
        }

        setData(response.data);
        const summaries = processItemsByDate(response.data.items, response.data.payments);
        setDailySummaries(summaries.sort((a, b) => b.date.localeCompare(a.date)));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, [processItemsByDate]);

  // All useMemo hooks
  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const itemDate = new Date(item.created_at);
      const inDateRange = itemDate >= dateRange.start && itemDate <= dateRange.end;
      return matchesSearch && matchesCategory && inDateRange;
    });
  }, [data, searchTerm, selectedCategory, dateRange]);

  const categories = useMemo(() => {
    if (!data) return [];
    return ['all', ...new Set(data.items.map(item => item.category))];
  }, [data]);

  const categoryData = useMemo(() => {
    if (!filteredItems.length) return [];
    const categoryCounts = groupBy(filteredItems, 'category');
    return Object.entries(categoryCounts).map(([category, items]) => ({
      name: category,
      value: items.reduce((sum, item) => sum + item.quantity, 0),
    }));
  }, [filteredItems]);

  const chartData = useMemo(() => {
    return dailySummaries.map(summary => ({
      date: format(parseISO(summary.date), 'MMM dd'),
      sales: summary.totalSales,
      items: summary.totalItems,
      orders: summary.totalOrders
    }));
  }, [dailySummaries]);

  // Memoize calculations
  const totals = useMemo(() => {
    if (!data || !filteredItems) return { sales: 0, items: 0, orders: 0 };
    const totalSales = data.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalOrders = new Set(filteredItems.map(item => item.bill_number)).size;
    return { sales: totalSales, items: totalItems, orders: totalOrders };
  }, [data, filteredItems]);

  // Export function
  const exportData = useCallback(() => {
    if (!data) return;
    
    const workbook = utils.book_new();
    
    const itemsWS = utils.json_to_sheet(data.items.map(item => ({
      ...item,
      created_at: format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss'),
      updated_at: format(new Date(item.updated_at), 'yyyy-MM-dd HH:mm:ss'),
    })));
    utils.book_append_sheet(workbook, itemsWS, 'Items');
    
    const paymentsWS = utils.json_to_sheet(data.payments);
    utils.book_append_sheet(workbook, paymentsWS, 'Payments');
    
    const summariesWS = utils.json_to_sheet(dailySummaries);
    utils.book_append_sheet(workbook, summariesWS, 'Daily Summaries');
    
    writeFile(workbook, 'sales-dashboard-export.xlsx');
    toast.success('Data exported successfully!');
  }, [data, dailySummaries]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-semibold text-gray-700 flex items-center space-x-2"
        >
          <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading dashboard...</span>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-semibold text-red-600 p-8 rounded-lg bg-red-50 shadow-lg"
        >
          {error || 'No data available'}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <motion.h1
              variants={cardVariants}
              className="text-4xl font-bold text-gray-900 flex items-center"
            >
              <ChartBarIcon className="h-8 w-8 text-blue-500 mr-3" />
              Sales
            </motion.h1>
            <motion.button
              variants={cardVariants}
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export Data
            </motion.button>
          </div>

          <motion.div className="mb-8 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px] flex gap-2">
              <input
                type="date"
                value={format(dateRange.start, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={format(dateRange.end, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white p-6 rounded-xl shadow-lg ">
              <h3 className="text-lg font-semibold text-blue-700 flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Total Sales
              </h3>
              <p className="text-3xl font-bold text-blue-900">₹{totals.sales.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-blue-700 flex items-center">
                <ShoppingBagIcon className="h-5 w-5 mr-2" />
                Total Orders
              </h3>
              <p className="text-3xl font-bold text-blue-900">{totals.orders}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-blue-700 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Total Items
              </h3>
              <p className="text-3xl font-bold text-blue-900">{totals.items}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-blue-700 flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                Average Order
              </h3>
              <p className="text-3xl font-bold text-blue-900">
                ₹{totals.orders ? (totals.sales / totals.orders).toFixed(2) : '0.00'}
              </p>
            </div>
          </motion.div>

          <div className="mb-8">
            <nav className="flex space-x-4 bg-gray-900 p-2 rounded-lg font-semibold">
              {(['overview', 'daily', 'items', 'payments'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-white hover:bg-gray-700'
                  } px-4 py-2 rounded-md transition-all duration-200 capitalize flex-1`}
                >
                  {tab}
                </motion.button>
              ))}
            </nav>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              variants={tabVariants}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    variants={cardVariants}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-300"
                  >
                    <h3 className="text-xl font-semibold mb-4 text-center">Sales Trend</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="date" stroke="#6B7280" />
                          <YAxis stroke="#6B7280" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#3B82F6" 
                            name="Sales (₹)" 
                            strokeWidth={2} 
                            dot={false} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={cardVariants}
                    className="bg-white p-6 rounded-xl shadow-lg border border-gray-300"
                  >
                    <h3 className="text-xl font-semibold mb-4 text-center">Category Distribution</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>
              )}

              {activeTab === 'daily' && (
                <div className="space-y-6">
                {dailySummaries.map((summary, index) => (
                  <motion.div
                    key={summary.date}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-300"
                  >
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                      {format(parseISO(summary.date), 'MMMM dd, yyyy')}
                    </h3>
              
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Sales Summary */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 bg-gray-100 p-2 rounded-md">Sales Summary</h4>
                        <table className="w-full text-sm border border-gray-300">
                          <tbody>
                            <tr className="border-b border-gray-200">
                              <td className="p-2">Total Sales</td>
                              <td className="p-2 font-semibold text-right">₹{summary.totalSales.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-2">Orders</td>
                              <td className="p-2 font-semibold text-right">{summary.totalOrders}</td>
                            </tr>
                            <tr>
                              <td className="p-2">Items Sold</td>
                              <td className="p-2 font-semibold text-right">{summary.totalItems}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
              
                      {/* Payment Methods */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 bg-gray-100 p-2 rounded-md">Payment Methods</h4>
                        <table className="w-full text-sm border border-gray-300">
                          <tbody>
                            {Object.entries(summary.paymentMethods).map(([method, amount]) => (
                              <tr key={method} className="border-b border-gray-200">
                                <td className="p-2">{method}</td>
                                <td className="p-2 font-semibold text-right">₹{amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
              
                      {/* Top Items */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700 bg-gray-100 p-2 rounded-md">Top Items</h4>
                        <table className="w-full text-sm border border-gray-300">
                          <tbody>
                            {Object.entries(summary.itemsSold).map(([item, quantity]) => (
                              <tr key={item} className="border-b border-gray-200">
                                <td className="p-2">{item}</td>
                                <td className="p-2 font-semibold text-right">{quantity} units</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              )}

              {activeTab === 'items' && (
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Bill No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Item Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Variant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-center">
                      {filteredItems
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((item, index) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(parseISO(item.created_at), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{item.bill_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.subvariant}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{parseFloat(item.price).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                            </td>
                          </motion.tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          Totals
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                          {totals.items}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900">-</td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          ₹{filteredItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Payment ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Bill Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider text-center">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-center">
                      {data.payments.map((payment, index) => (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{payment.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{payment.bill_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{parseFloat(payment.amount).toFixed(2)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Total Payments
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{totals.sales.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </motion.div> </AnimatePresence>
        </motion.div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}

export default App;