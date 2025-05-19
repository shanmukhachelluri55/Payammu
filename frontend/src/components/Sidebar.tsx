import { useState, useEffect } from 'react';
import { 
  Tag, CreditCard, LayoutGrid, Receipt, Palette, 
  BarChart3, Menu, LogOut, FileText, UserPlus, 
  UserCog, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { cn } from './lib/utils';
import type { Page, UserRole } from '../types';

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[];
}

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  onSidebarToggle: (expanded: boolean) => void;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'register', icon: UserPlus, label: 'Register', roles: ['UNIVERSAL_ADMIN', 'MANAGE_ADMIN'] },
  { id: 'inventory-management', icon: LayoutGrid, label: 'Inventory', roles: ['UNIVERSAL_ADMIN', 'MANAGE_ADMIN'] },
  { id: 'billing', icon: LayoutGrid, label: 'Billing', roles: ['ORGANIZATION_ADMIN', 'MANAGER', 'STAFF'] },
  { id: 'items', icon: Receipt, label: 'Items', roles: ['ORGANIZATION_ADMIN', 'MANAGER', 'STAFF'] },
  { id: 'reports', icon: BarChart3, label: 'Reports', roles: ['ORGANIZATION_ADMIN', 'MANAGER'] },
  { id: 'sales-report', icon: LayoutGrid, label: 'Sales Report', roles: ['ORGANIZATION_ADMIN', 'MANAGER'] },
  { id: 'bill-management', icon: FileText, label: 'Bills', roles: ['ORGANIZATION_ADMIN', 'MANAGER', 'STAFF'] },
  { id: 'stock-position', icon: LayoutGrid, label: 'Stock Position', roles: ['ORGANIZATION_ADMIN', 'MANAGER', 'STAFF'] },
  { id: 'add-coupons', icon: Tag, label: 'Manage Coupons', roles: ['ORGANIZATION_ADMIN'] },
  { id: 'add-role', icon: UserCog, label: 'Add Role', roles: ['ORGANIZATION_ADMIN'] },
  { id: 'razorpay-lookup', icon: CreditCard, label: 'Razorpay Lookup', roles: ['UNIVERSAL_ADMIN', 'MANAGE_ADMIN'] },
  // { id: 'profile', icon: UserCog, label: 'Profile', roles: ['UNIVERSAL_ADMIN', 'MANAGE_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER', 'STAFF'] }, 
  { id: 'royalty-points', icon: CreditCard, label: 'Royalty Points', roles: ['ORGANIZATION_ADMIN', 'MANAGER', 'STAFF'] },  // <-- Added here
  { id: 'themes', icon: Palette, label: 'Themes', roles: ['UNIVERSAL_ADMIN', 'MANAGE_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER', 'STAFF'] },
];



export default function Sidebar({ currentPage, onPageChange, onLogout, onSidebarToggle }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [name, setName] = useState<string>('Dashboard');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const role = localStorage.getItem('role') as UserRole;

  useEffect(() => {
    const storedName = localStorage.getItem('name');
    const storedImageUrl = localStorage.getItem('imageUrl');

    if (storedName) setName(storedName);
    if (storedImageUrl) setImageUrl(storedImageUrl);
  }, []);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onSidebarToggle(!isExpanded);
  };

  const filteredMenuItems = MENU_ITEMS.filter((item) => item.roles.includes(role));

  const confirmLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    onLogout();
  };

  return (
    <>
      <div className={cn(
        "h-screen bg-gray-800 border-r flex flex-col fixed left-0 top-0 transition-all duration-300 ease-in-out z-10",
        isExpanded ? "w-60" : "w-16"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {isExpanded && (
            <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full shadow-xl transform transition-transform duration-300 hover:scale-105">
                <div className="w-full h-full bg-blue-700 flex items-center justify-center rounded-full">
                  <span className="text-white text-sm font-semibold">
                    {name.split(' ').map((part) => part[0]).join('').toUpperCase()}
                  </span>
                </div>
            </div>
            <span className="text-lg font-bold text-white bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {
                name.split(/[\s_\.]/).map((part, index) => (
                  <div key={index}>{part}</div>
                ))
              }
            </span>
          </div>
          
          )}
          <button 
          onClick={handleToggle} 
          className="p-2 bg-gray-700 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 shadow-md hover:shadow-lg flex items-center justify-center w-8 h-8"
        >
          <div className="flex flex-col justify-between w-4 h-3">
            <span className="block w-full h-0.5 bg-white rounded"></span>
            <span className="block w-full h-0.5 bg-white rounded"></span>
            <span className="block w-full h-0.5 bg-white rounded"></span>
          </div>
        </button>
        </div>

        {/* Menu Items */}
        <div className="flex-grow flex flex-col gap-2 p-3 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id as Page)}
              className={cn(
                "w-full p-3 rounded-lg flex items-center gap-3 transition-all duration-300 group relative transform hover:scale-105",
                currentPage === item.id
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white",
                !isExpanded && "justify-center"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform duration-300", currentPage === item.id ? "text-white" : "text-gray-400 group-hover:text-white", !isExpanded && "w-6 h-6")} />
              {isExpanded && <span className="text-sm font-medium truncate transition-opacity duration-300">{item.label}</span>}
              {!isExpanded && <div className="absolute left-14 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 shadow-lg">{item.label}</div>}
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={confirmLogout}
            className={cn(
              "w-full p-3 rounded-lg flex items-center gap-3 text-red-400 bg-gray-700 hover:bg-red-500 hover:text-white shadow-md transition-all duration-300",
              !isExpanded && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isExpanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
    <div className="bg-gray-900 bg-opacity-90 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-[22rem] transform transition-all scale-95 animate-fadeIn hover:scale-100 duration-300">
      {/* Header */}
      <h3 className="text-2xl font-bold text-white text-center tracking-wide">
        Confirm Logout
      </h3>
      <p className="text-sm text-gray-300 mt-2 text-center leading-relaxed">
        Are you sure you want to log out ?
      </p>

      {/* Buttons */}
      <div className="flex justify-center mt-6 gap-5">
        <button
          onClick={() => setIsLogoutModalOpen(false)}
          className="px-5 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Cancel
        </button>
        <button
          onClick={handleLogout}
          className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
)}

    </>
  );
}
