import React, { useEffect, useState } from 'react';
import { BarChart, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import BarChartComponent from './BarChartComponent';
import { fetchOrders } from '../../services/reportsService';

interface Order {
  bill_number: number;
  created_at: string;
  total_amount: number;
  payment_method: string;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  paymentMethods: { [key: string]: { count: number; amount: number } };
}

function App({ currentTheme = 'indigo' }: { currentTheme?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
          throw new Error("User ID not found in localStorage");
        }

        const ordersData = await fetchOrders(userId);
        setOrders(ordersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const filterByTimeRange = (orders: Order[], range: 'daily' | 'monthly' | 'yearly') => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log('startOfToday:', startOfToday);
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);

      switch (range) {
        case 'daily':
          const startOfOrderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
          console.log('startOfOrderDay:', startOfOrderDay);
          return startOfOrderDay.getTime() === startOfToday.getTime();
        case 'monthly':
          return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
        case 'yearly':
          return orderDate.getFullYear() === now.getFullYear();
        default:
          return false;
      }
    });
  };

  const calculateOrderStats = (orders: Order[]): OrderStats => {
    const uniqueBillNumbers = new Set<number>();
    return orders.reduce<OrderStats>((stats, order) => {
      if (!uniqueBillNumbers.has(order.bill_number)) {
        uniqueBillNumbers.add(order.bill_number);
        stats.totalOrders += 1;
      }

      stats.totalRevenue += order.total_amount;

      if (!stats.paymentMethods[order.payment_method]) {
        stats.paymentMethods[order.payment_method] = { count: 0, amount: 0 };
      }

      stats.paymentMethods[order.payment_method].count += 1;
      stats.paymentMethods[order.payment_method].amount += order.total_amount;

      return stats;
    }, {
      totalOrders: 0,
      totalRevenue: 0,
      paymentMethods: {},
    });
  };

  const StatCard = ({
    title,
    stats,
    icon: Icon,
    isLoading,
  }: {
    title: string;
    stats: OrderStats;
    icon: React.ElementType;
    isLoading: boolean;
  }) => (
    <div className={`bg-white rounded-lg shadow-lg p-6 bg-${currentTheme}-50`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 bg-${currentTheme}-100 rounded-lg shadow-sm`}>
          {isLoading ? (
            <Loader2 className={`w-6 h-6 text-${currentTheme}-600 animate-spin`} />
          ) : (
            <Icon className={`w-6 h-6 text-${currentTheme}-600`} />
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mt-4"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={`bg-${currentTheme}-50 p-3 rounded-lg`}>
              <p className={`text-sm text-${currentTheme}-600 mb-1`}>Total Orders</p>
              <p className="text-xl font-semibold">{stats.totalOrders}</p>
            </div>
            <div className={`bg-emerald-50 p-3 rounded-lg`}>
              <p className="text-sm text-emerald-600 mb-1">Revenue</p>
              <p className="text-xl font-semibold">₹{stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Methods</h4>
            <div className="space-y-2">
              {Object.entries(stats.paymentMethods).map(([method, { count, amount }]) => (
                <div key={method} className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    {method}
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {count} {count === 1 ? 'order' : 'orders'}
                    </span>
                  </span>
                  <span>₹{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className={`bg-${currentTheme}-50 text-gray-600 p-6 rounded-lg shadow-lg max-w-md w-full`}>
          <h2 className="text-lg font-semibold mb-2">No Orders Available</h2>
          <p className="mb-4">It seems there are no orders for the selected time period. Please check back later.</p>
          <button
            onClick={() => window.location.reload()}
            className={`w-full bg-${currentTheme}-600 text-white py-2 px-4 rounded-lg hover:bg-${currentTheme}-700 transition-colors`}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const dailyStats = calculateOrderStats(filterByTimeRange(orders, 'daily'));
  const monthlyStats = calculateOrderStats(filterByTimeRange(orders, 'monthly'));
  const yearlyStats = calculateOrderStats(filterByTimeRange(orders, 'yearly'));
  console.log(dailyStats);
  console.log(orders);

  return (
    <div className={`min-h-screen p-2 bg-${currentTheme}-50`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
          {loading && (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Refreshing data...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Daily Orders" stats={dailyStats} icon={Calendar} isLoading={loading} />
          <StatCard title="Monthly Orders" stats={monthlyStats} icon={BarChart} isLoading={loading} />
          <StatCard title="Yearly Orders" stats={yearlyStats} icon={TrendingUp} isLoading={loading} />
        </div>
      </div>
      <div className="min-h-screen pt-8">
        <BarChartComponent />
      </div>
    </div>
  );
}

export default App;
