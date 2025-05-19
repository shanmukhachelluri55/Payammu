import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
// import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';

 
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // To handle loading state
  const navigate = useNavigate();
 
  // Check if the user is logged in before the first render
  useEffect(() => {
    const userID = localStorage.getItem('userID');
    if (userID) {
      setIsAuthenticated(true); // If userID exists, set authenticated
    }
    setLoading(false); // Set loading to false once the check is complete
  }, []);
 
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userID'); // Clear userID from localStorage
    setIsAuthenticated(false);
    navigate('/'); // Navigate to the login page
  };
 
  // Handle successful login
  const handleLoginSuccess = (userID:string,address:string,email:string,shopName:string) => {
    localStorage.setItem('userID', userID); // Store userID in localStorage
    localStorage.setItem('email', email); // Store userID in localStorage
    localStorage.setItem('address', address); // Store userID in localStorage
    localStorage.setItem('restaurant', shopName); // Store userID in localStorage
    setIsAuthenticated(true);
  };
 
  if (loading) {
    return (
    <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
  )}
 
  // If the user is authenticated, show the Dashboard
  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }
 
  // If not authenticated, show the login route
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Routes>
        <Route
          path="/"
          element={
            <Login
              onRegisterClick={() => navigate('/register')}
              onForgotClick={() => navigate('/forgot-password')}
              onLoginSuccess={handleLoginSuccess} // Pass login success handler
            />
          }
        />
        {/* <Route
          path="/register"
          element={<Register onLoginClick={() => navigate('/')} />}
        /> */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword onBackToLogin={() => navigate('/')} />}
        />
      </Routes>
    </div>
  );
}
 
export default App;


// import React, { useState, useMemo } from 'react';
// import {
//   Package, AlertTriangle, ArrowUpDown, Search,
//   Filter, Download, Plus, RefreshCcw, Archive,
//   TrendingUp, TrendingDown, MoreVertical, Box
// } from 'lucide-react';

// // Types
// interface StockItem {
//   id: string;
//   name: string;
//   sku: string;
//   currentStock: number;
//   minimumStock: number;
//   maximumStock: number;
//   reorderPoint: number;
//   unit: string;
//   category: string;
//   location: string;
//   lastUpdated: string;
//   status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';
//   trend: 'up' | 'down' | 'stable';
// }

// // Mock data
// const generateMockData = (): StockItem[] => {
//   const categories = ['Raw Materials', 'Finished Goods', 'Packaging', 'Spare Parts'];
//   const units = ['pcs', 'kg', 'liters', 'boxes'];
//   const locations = ['Warehouse A', 'Warehouse B', 'Production Floor', 'Storage Room'];
  
//   return Array.from({ length: 12 }, (_, i): StockItem => {
//     const currentStock = Math.floor(Math.random() * 1000);
//     const minimumStock = Math.floor(Math.random() * 200) + 100;
//     const maximumStock = minimumStock * 3;
//     const reorderPoint = minimumStock * 1.5;
    
//     let status: StockItem['status'] = 'in-stock';
//     if (currentStock <= 0) status = 'out-of-stock';
//     else if (currentStock < minimumStock) status = 'low-stock';
//     else if (currentStock > maximumStock) status = 'overstock';

//     return {
//       id: `item-${i + 1}`,
//       name: `Inventory Item ${i + 1}`,
//       sku: `SKU${String(i + 1).padStart(4, '0')}`,
//       currentStock,
//       minimumStock,
//       maximumStock,
//       reorderPoint,
//       unit: units[Math.floor(Math.random() * units.length)],
//       category: categories[Math.floor(Math.random() * categories.length)],
//       location: locations[Math.floor(Math.random() * locations.length)],
//       lastUpdated: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
//       status,
//       trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as StockItem['trend']
//     };
//   });
// };

// function App() {
//   // State
//   const [items] = useState<StockItem[]>(generateMockData());
//   const [searchTerm, setSearchTerm] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('all');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [sortConfig, setSortConfig] = useState({ key: 'currentStock', direction: 'desc' });
//   const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

//   // Computed values
//   const filteredItems = useMemo(() => {
//     return items
//       .filter(item => {
//         const matchesSearch = 
//           item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           item.sku.toLowerCase().includes(searchTerm.toLowerCase());
//         const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
//         const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
//         return matchesSearch && matchesCategory && matchesStatus;
//       })
//       .sort((a, b) => {
//         const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
//         return multiplier * (a[sortConfig.key as keyof StockItem] > b[sortConfig.key as keyof StockItem] ? 1 : -1);
//       });
//   }, [items, searchTerm, categoryFilter, statusFilter, sortConfig]);

//   const metrics = useMemo(() => {
//     const totalItems = items.length;
//     const lowStock = items.filter(item => item.status === 'low-stock').length;
//     const outOfStock = items.filter(item => item.status === 'out-of-stock').length;
//     const overstock = items.filter(item => item.status === 'overstock').length;
    
//     return { totalItems, lowStock, outOfStock, overstock };
//   }, [items]);

//   // Handlers
//   const toggleExpand = (id: string) => {
//     setExpandedItems(prev => {
//       const next = new Set(prev);
//       if (next.has(id)) next.delete(id);
//       else next.add(id);
//       return next;
//     });
//   };

//   const handleSort = (key: keyof StockItem) => {
//     setSortConfig(prev => ({
//       key,
//       direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
//     }));
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Stock Position</h1>
//             <p className="mt-1 text-sm text-gray-500">
//               Manage and monitor your inventory levels
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
//               <Download className="h-4 w-4 mr-2" />
//               Export
//             </button>
//             <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
//               <Plus className="h-4 w-4 mr-2" />
//               Add Item
//             </button>
//           </div>
//         </div>

//         {/* Metrics */}
//         <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
//           <div className="bg-white overflow-hidden shadow rounded-lg">
//             <div className="p-5">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <Box className="h-6 w-6 text-gray-400" />
//                 </div>
//                 <div className="ml-5 w-0 flex-1">
//                   <dl>
//                     <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
//                     <dd className="flex items-baseline">
//                       <div className="text-2xl font-semibold text-gray-900">{metrics.totalItems}</div>
//                     </dd>
//                   </dl>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white overflow-hidden shadow rounded-lg">
//             <div className="p-5">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <AlertTriangle className="h-6 w-6 text-yellow-400" />
//                 </div>
//                 <div className="ml-5 w-0 flex-1">
//                   <dl>
//                     <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
//                     <dd className="flex items-baseline">
//                       <div className="text-2xl font-semibold text-gray-900">{metrics.lowStock}</div>
//                     </dd>
//                   </dl>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white overflow-hidden shadow rounded-lg">
//             <div className="p-5">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <Package className="h-6 w-6 text-red-400" />
//                 </div>
//                 <div className="ml-5 w-0 flex-1">
//                   <dl>
//                     <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
//                     <dd className="flex items-baseline">
//                       <div className="text-2xl font-semibold text-gray-900">{metrics.outOfStock}</div>
//                     </dd>
//                   </dl>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white overflow-hidden shadow rounded-lg">
//             <div className="p-5">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <Archive className="h-6 w-6 text-blue-400" />
//                 </div>
//                 <div className="ml-5 w-0 flex-1">
//                   <dl>
//                     <dt className="text-sm font-medium text-gray-500 truncate">Overstock Items</dt>
//                     <dd className="flex items-baseline">
//                       <div className="text-2xl font-semibold text-gray-900">{metrics.overstock}</div>
//                     </dd>
//                   </dl>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="bg-white shadow rounded-lg mb-8">
//           <div className="p-4">
//             <div className="flex flex-col sm:flex-row gap-4">
//               <div className="flex-1">
//                 <div className="relative rounded-md shadow-sm">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <Search className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <input
//                     type="text"
//                     className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
//                     placeholder="Search items..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                   />
//                 </div>
//               </div>
//               <div className="flex gap-4">
//                 <select
//                   className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
//                   value={categoryFilter}
//                   onChange={(e) => setCategoryFilter(e.target.value)}
//                 >
//                   <option value="all">All Categories</option>
//                   <option value="Raw Materials">Raw Materials</option>
//                   <option value="Finished Goods">Finished Goods</option>
//                   <option value="Packaging">Packaging</option>
//                   <option value="Spare Parts">Spare Parts</option>
//                 </select>
//                 <select
//                   className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
//                   value={statusFilter}
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                 >
//                   <option value="all">All Status</option>
//                   <option value="in-stock">In Stock</option>
//                   <option value="low-stock">Low Stock</option>
//                   <option value="out-of-stock">Out of Stock</option>
//                   <option value="overstock">Overstock</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Stock Table */}
//         <div className="bg-white shadow rounded-lg overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Item Details
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
//                     onClick={() => handleSort('currentStock')}
//                   >
//                     <div className="flex items-center gap-2">
//                       Stock Level
//                       <ArrowUpDown className="h-4 w-4" />
//                     </div>
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Location
//                   </th>
//                   <th scope="col" className="relative px-6 py-3">
//                     <span className="sr-only">Actions</span>
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredItems.map(item => (
//                   <React.Fragment key={item.id}>
//                     <tr className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div>
//                             <div className="text-sm font-medium text-gray-900">{item.name}</div>
//                             <div className="text-sm text-gray-500">{item.sku}</div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <span className="text-sm text-gray-900">{item.currentStock} {item.unit}</span>
//                           {item.trend === 'up' && <TrendingUp className="ml-2 h-4 w-4 text-green-500" />}
//                           {item.trend === 'down' && <TrendingDown className="ml-2 h-4 w-4 text-red-500" />}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
//                           ${item.status === 'in-stock' ? 'bg-green-100 text-green-800' :
//                             item.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
//                             item.status === 'out-of-stock' ? 'bg-red-100 text-red-800' :
//                             'bg-blue-100 text-blue-800'}`}>
//                           {item.status.replace('-', ' ').toUpperCase()}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {item.location}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                         <button
//                           onClick={() => toggleExpand(item.id)}
//                           className="text-indigo-600 hover:text-indigo-900"
//                         >
//                           Details
//                         </button>
//                       </td>
//                     </tr>
//                     {expandedItems.has(item.id) && (
//                       <tr className="bg-gray-50">
//                         <td colSpan={5} className="px-6 py-4">
//                           <div className="grid grid-cols-3 gap-4">
//                             <div>
//                               <h4 className="text-sm font-medium text-gray-900">Stock Levels</h4>
//                               <dl className="mt-2 text-sm text-gray-500">
//                                 <div className="flex justify-between py-1">
//                                   <dt>Minimum Stock:</dt>
//                                   <dd className="font-medium">{item.minimumStock} {item.unit}</dd>
//                                 </div>
//                                 <div className="flex justify-between py-1">
//                                   <dt>Maximum Stock:</dt>
//                                   <dd className="font-medium">{item.maximumStock} {item.unit}</dd>
//                                 </div>
//                                 <div className="flex justify-between py-1">
//                                   <dt>Reorder Point:</dt>
//                                   <dd className="font-medium">{item.reorderPoint} {item.unit}</dd>
//                                 </div>
//                               </dl>
//                             </div>
//                             <div>
//                               <h4 className="text-sm font-medium text-gray-900">Details</h4>
//                               <dl className="mt-2 text-sm text-gray-500">
//                                 <div className="flex justify-between py-1">
//                                   <dt>Category:</dt>
//                                   <dd className="font-medium">{item.category}</dd>
//                                 </div>
//                                 <div className="flex justify-between py-1">
//                                   <dt>Last Updated:</dt>
//                                   <dd className="font-medium">
//                                     {new Date(item.lastUpdated).toLocaleDateString()}
//                                   </dd>
//                                 </div>
//                               </dl>
//                             </div>
//                             <div>
//                               <h4 className="text-sm font-medium text-gray-900">Actions</h4>
//                               <div className="mt-2 flex flex-col gap-2">
//                                 <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
//                                   <RefreshCcw className="h-4 w-4 mr-2" />
//                                   Update Stock
//                                 </button>
//                                 <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">
//                                   <MoreVertical className="h-4 w-4 mr-2" />
//                                   More Options
//                                 </button>
//                               </div>
//                             </div>
//                           </div>
//                         </td>
//                       </tr>
//                     )}
//                   </React.Fragment>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;
