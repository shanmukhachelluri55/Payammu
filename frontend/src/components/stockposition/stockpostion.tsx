import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ArrowUpDown, Package, AlertTriangle, CheckCircle2, RefreshCw,
  TrendingUp, TrendingDown, Calendar, BarChart3, Settings, Download, Droplets
} from 'lucide-react';
import { fetchItems } from '../../services/service';
import * as XLSX from 'xlsx';
import ScrollToTopButton from '../SalesReport/ScrollToTopButton'; 

// Types
interface StockItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  minStock: number;
  stockPosition: number;
  userId: number;
  subVariant: string;
  created_at: string;
  updated_at: string;
}

interface StockStatus {
  isLow: boolean;
  severity: 'critical' | 'warning' | 'normal';
}

// Utils
const getStockStatus = (item: StockItem): StockStatus => {
  const ratio = item.stockPosition / item.minStock;
  if (ratio <= 0.5) return { isLow: true, severity: 'critical' };
  if (ratio <= 1) return { isLow: true, severity: 'warning' };
  return { isLow: false, severity: 'normal' };
};

const formatDate = (date: string) => new Date(date).toLocaleDateString();
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);

// Sub-components
const StockIndicator: React.FC<{ status: StockStatus; size?: 'sm' | 'md' }> = ({ 
  status, 
  size = 'md' 
}) => {
  const colors = {
    critical: 'bg-red-500',
    warning: 'bg-yellow-500',
    normal: 'bg-green-500'
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3'
  };

  return (
    <div className="relative">
      <span 
        className={`inline-block ${sizes[size]} rounded-full ${colors[status.severity]} 
          shadow-md ring-2 ring-opacity-25 ${colors[status.severity]}`}
        title={status.isLow ? 'Low Stock' : 'Stock OK'}
      />
      <span 
        className={`absolute -top-1 -left-1 ${sizes[size]} animate-ping rounded-full ${colors[status.severity]} opacity-75`}
      />
    </div>
  );
};

const StockItem: React.FC<{ item: StockItem }> = ({ item }) => {
  const stockStatus = getStockStatus(item);
  const percentageOfMin = (item.stockPosition / item.minStock) * 100;

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <StockIndicator status={stockStatus} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <span className="px-2.5 py-0.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                  {item.subVariant}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                  {item.category}
                </span>
                <span>•</span>
                <span className="font-medium">{formatCurrency(item.price)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">
              Updated {formatDate(item.updated_at)}
            </span>
            {!item.available && (
              <span className="mt-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                Unavailable
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium text-gray-900">Stock Level</span>
                <span className="ml-2 text-sm text-gray-600">
                  ({Math.round(percentageOfMin)}%)
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {item.stockPosition} / {item.minStock} units
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`transition-all duration-500 ${
                  stockStatus.severity === 'critical' ? 'bg-red-500' :
                  stockStatus.severity === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentageOfMin, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Total Value: {formatCurrency(item.price * item.stockPosition)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${stockStatus.isLow ? 'text-red-500' : 'text-green-500'}`} />
              <span className={`text-sm font-medium ${stockStatus.isLow ? 'text-red-600' : 'text-green-600'}`}>
                {stockStatus.isLow ? 'Low Stock' : 'Stock OK'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
  className?: string;
}> = ({ title, value, icon, trend, className = '' }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`}>
    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-50 opacity-20" />
    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-blue-50 opacity-20" />
    
    <div className="relative flex items-center gap-4">
      <div className="rounded-lg bg-blue-50 p-3">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <span className={`flex items-center text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {trend}%
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

function Stockposition() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const fetchInventoryItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      
      const response = await fetchItems(userId);
      setItems(response);
    } catch (error) {
      setError('Failed to fetch inventory items');
      console.error('Failed to fetch inventory items:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const categories = useMemo(() => 
    ['all', ...new Set(items.map(item => item.category))],
    [items]
  );

  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter(item => 
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.subVariant.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCategory === 'all' || item.category === selectedCategory)
      )
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name) || 
                      a.subVariant.localeCompare(b.subVariant);
        } else if (sortBy === 'stock') {
          comparison = b.stockPosition - a.stockPosition;
        } else if (sortBy === 'value') {
          comparison = (b.price * b.stockPosition) - (a.price * a.stockPosition);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [items, searchTerm, selectedCategory, sortBy, sortOrder]);

  const lowStockItems = useMemo(() => 
    filteredAndSortedItems.filter(item => getStockStatus(item).isLow),
    [filteredAndSortedItems]
  );

  const totalValue = useMemo(() => 
    items.reduce((sum, item) => sum + item.price * item.stockPosition, 0),
    [items]
  );

  const stats = {
    total: items.length,
    lowStock: lowStockItems.length,
    healthy: items.length - lowStockItems.length,
    value: formatCurrency(totalValue)
  };

  const handleExport = () => {
    const dataForExport = filteredAndSortedItems.map(item => ({
      Name: item.name,
      'Sub Variant': item.subVariant,
      Category: item.category,
      'Current Stock': item.stockPosition,
      'Minimum Stock': item.minStock,
      'Unit Price': formatCurrency(item.price),
      'Total Value': formatCurrency(item.price * item.stockPosition),
      'Status': item.available ? 'Available' : 'Unavailable',
      'Last Updated': formatDate(item.updated_at)
    }));
  
    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, 'Inventory_Report.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stock Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Monitor and manage your inventory levels efficiently
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
              <button 
                onClick={fetchInventoryItems}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Items"
              value={stats.total}
              icon={<Package className="w-6 h-6 text-blue-600" />}
              trend={2.5}
              className="border-b-4 border-blue-500"
            />
            <StatCard 
              title="Low Stock Items"
              value={stats.lowStock}
              icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
              trend={-1.2}
              className="border-b-4 border-yellow-500"
            />
            <StatCard 
              title="Healthy Stock"
              value={stats.healthy}
              icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
              trend={3.8}
              className="border-b-4 border-green-500"
            />
            <StatCard 
              title="Total Value"
              value={stats.value}
              icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
              trend={5.2}
              className="border-b-4 border-purple-500"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or variant..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (sortBy === 'name') {
                    setSortBy('stock');
                  } else if (sortBy === 'stock') {
                    setSortBy('value');
                  } else {
                    setSortBy('name');
                    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
                  }
                }}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 shadow-sm transition-all duration-200"
              >
                <ArrowUpDown className="w-5 h-5 text-gray-500" />
                <span>Sort by {
                  sortBy === 'name' ? 'Stock Level' :
                  sortBy === 'stock' ? 'Value' : 'Name'
                }</span>
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 shadow-sm transition-all duration-200"
                title={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`}
              >
                {viewMode === 'list' ? (
                  <Settings className="w-5 h-5 text-gray-500" />
                ) : (
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                )}
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">
                Inventory Items ({filteredAndSortedItems.length})
              </h2>
              <div className="flex items-center gap-4 text-sm text-white">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Last updated: {formatDate(new Date().toISOString())}
                </span>
              </div>
            </div>
          </div>

          <div className={`p-6 ${viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}`}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 text-lg">Loading inventory items...</p>
              </div>
            ) : filteredAndSortedItems.length > 0 ? (
              filteredAndSortedItems.map((item) => (
                <StockItem key={item.id} item={item} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg mb-4">No items found matching your criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      < ScrollToTopButton />
    </div>
  );
}

export default Stockposition;