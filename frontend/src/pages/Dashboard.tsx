import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import BillingScreen from '../components/POS_Screens/BillingScreen';
import ItemsScreen from '../components/Items_Screens/ItemsScreen';
import ReportsScreen from '../components/Reports_Screens/ReportsScreen';
import ThemesScreen from '../components/Theams_screen/ThemesScreen';
import Register from '../components/add_store/Register';
import AddRole from '../components/addNewrole/newROLE';
import Addcoupons from '../components/Coupons/CouponForm';
import BillManagement from '../components/BillMangement_screens/BillMangement';
import InventoryManagement from '../components/inventory_universal_admin/InventoryManagement';
import Stockposition from '../components/stockposition/stockpostion';
import { RazorpayLookup } from '../components/Rozorpayment/RazorpayLookup';
// import { ProfileForm } from '../components/profile/ProfileForm';
import Royalitypoints from "../components/royalitypoints/Royalitypoints";
import Salessheet from "../components/SalesReport/salessheet"; // ✅ Fixed import
import type { Bill, Item, Sale, ThemeColor, Page } from '../types';

interface DashboardProps {
  onLogout: () => void;
}

function Dashboard({ onLogout }: DashboardProps) {
  const role = localStorage.getItem('role');
  const [currentPage, setCurrentPage] = useState<Page>(
    role === 'UNIVERSAL_ADMIN' || role === 'MANAGE_ADMIN' ? 'register' : 'billing'
  );
  const [items, setItems] = useState<Item[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [theme, setTheme] = useState<ThemeColor>('indigo');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const handleAddItem = (item: Item) => {
    setItems((prev) => [...prev, item]);
  };

  const handleEditItem = (item: Item) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleCompleteSale = (sale: Omit<Sale, 'id' | 'timestamp'>) => {
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setSales((prev) => [...prev, newSale]);

    const newBill: Bill = {
      id: `BILL${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      items: sale.items,
      subtotal: sale.subtotal,
      gst: sale.gst,
      total: sale.total,
      status: 'pending',
      cancelled_user: undefined,
      cancelBill_user_payload_id: undefined,
      billname: undefined,
      splitpayment: undefined,
      customerName: '',
      serviceCharge: 0,
      serviceChargeAmount: 0,
      paymentMethod: ''
    };
    setBills((prev) => [...prev, newBill]);
  };

  const handleRegisterComplete = () => {
    setCurrentPage('billing');
  };

  const handleRoleAdded = (role: { name: string; permissions: string[] }) => {
    console.log('New role added:', role);
    setCurrentPage('billing');
  };

  const getPageContent = () => {
    switch (currentPage) {
      case 'billing':
        return (
          <BillingScreen
            items={items}
            onCompleteSale={handleCompleteSale}
            currentTheme={theme}
          />
        );
      case 'items':
        return (
          <ItemsScreen
            items={items}
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            currentTheme={theme}
          />
        );
      case 'reports':
        return <ReportsScreen sales={sales} currentTheme={theme} />;
      case 'sales-report': // ✅ Updated case to match menu item
        return <Salessheet />;
      case 'themes':
        return <ThemesScreen currentTheme={theme} onThemeChange={setTheme} />;
      case 'bill-management':
        return (
          <BillManagement
            currentTheme={theme}
            bills={bills}
            onUpdateBill={(updatedBill) => {
              setBills((prev) =>
                prev.map((bill) => (bill.id === updatedBill.id ? updatedBill : bill))
              );
            }}
          />
        );
      case 'register':
        return <Register onLoginClick={handleRegisterComplete} />;
      case 'add-role':
        return <AddRole currentTheme={theme} onRoleAdded={handleRoleAdded} />;
      case 'add-coupons':
        return <Addcoupons />;
      case 'inventory-management':
        return <InventoryManagement />;
      case 'stock-position': 
        return <Stockposition items={items} />;
      case 'razorpay-lookup': 
        return <RazorpayLookup />;
      // case 'profile':
      //   return <ProfileForm />;
      case 'royalty-points':
        return <Royalitypoints />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex bg-${theme}-50 min-h-screen`}>
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={onLogout}
        onSidebarToggle={(expanded) => setIsSidebarExpanded(expanded)}
      />
      <main 
        className={`flex-1 transition-all duration-300 ${
          isSidebarExpanded ? 'ml-60' : 'ml-16'
        }`}
      >
        <div>
          {getPageContent()}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
