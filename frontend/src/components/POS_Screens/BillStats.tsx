import { CircleDollarSign, Package, XCircle, AlertTriangle, Trash } from 'lucide-react';
import { BillStats as BillStatsType } from '../../types';

interface BillStatsProps {
  stats: BillStatsType;
  currentTheme: string;
}

export default function BillStats({ stats, currentTheme }: BillStatsProps) {
  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: Package,
      color: `${currentTheme}-500`,
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalAmount.toFixed(2)}`,
      icon: CircleDollarSign,
      color: 'green-500',
    },
    {
      title: 'Cancelled & Deleted',
      value: stats.cancelledOrders + stats.deletedOrders,
      icon: XCircle,
      color: 'red-500',
    },
    {
      title: 'Lost Revenue',
      value: `₹${(stats.cancelledAmount + stats.deletedAmount).toFixed(2)}`,
      icon: AlertTriangle,
      color: 'yellow-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-6 flex items-center space-x-4"
          >
            <div className={`p-3 rounded-full bg-${stat.color}/10`}>
              <Icon className={`w-6 h-6 text-${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}