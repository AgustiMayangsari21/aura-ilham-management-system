import React, { useState, useEffect } from 'react';
import POSSystem from '../features/pos/POSSystem';
import MenuManagement from '../features/menu/MenuManagement';
import Inventory from '../features/inventory/Inventory';
import OrderHistory from '../features/orders/OrderHistory';
import KitchenDisplay from '../features/kitchen/KitchenDisplay';
import AdminConsole from '../features/admin/AdminConsole';
import AnalyticsPanel from '../features/analytics/AnalyticsPanel';
import auraLogo from '../assets/aurailhamlogo.png';

const navigationList = [
  { 
    id: 'pos', 
    name: 'POS System',
    icon: (className) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    id: 'menu', 
    name: 'Menu Catalog',
    icon: (className) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    id: 'inventory', 
    name: 'Inventory',
    icon: (className) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  { 
    id: 'orders', 
    name: 'Order History',
    icon: (className) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
      </svg>
    )
  },
  { 
    id: 'kitchen', 
    name: 'Kitchen Display',
    icon: (className) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    )
  },
  { 
    id: 'admin', 
    name: 'Admin Console',
    icon: (className) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    id: 'analytics', 
    name: 'Business Analytics',
    icon: (className) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    )
  },
];

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

const tabConfig = {
  pos: {
    active: 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600 rounded-r-2xl rounded-l-none',
    hover: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    dotActive: 'bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    dotHover: 'group-hover:bg-emerald-500',
    textGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent',
    ambientBg: 'bg-emerald-100/30',
    activeIcon: 'text-emerald-700'
  },
  menu: {
    active: 'bg-orange-50 text-orange-700 border-l-4 border-orange-600 rounded-r-2xl rounded-l-none',
    hover: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    dotActive: 'bg-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.8)]',
    dotHover: 'group-hover:bg-orange-500',
    textGradient: 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent',
    ambientBg: 'bg-orange-100/25',
    activeIcon: 'text-orange-600'
  },
  inventory: {
    active: 'bg-teal-50 text-teal-700 border-l-4 border-teal-600 rounded-r-2xl rounded-l-none',
    hover: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    dotActive: 'bg-teal-600 shadow-[0_0_8px_rgba(20,184,166,0.8)]',
    dotHover: 'group-hover:bg-teal-500',
    textGradient: 'bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 bg-clip-text text-transparent',
    ambientBg: 'bg-teal-100/25',
    activeIcon: 'text-teal-600'
  },
  orders: {
    active: 'bg-rose-50 text-rose-700 border-l-4 border-rose-600 rounded-r-2xl rounded-l-none',
    hover: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    dotActive: 'bg-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
    dotHover: 'group-hover:bg-rose-500',
    textGradient: 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-700 bg-clip-text text-transparent',
    ambientBg: 'bg-rose-100/25',
    activeIcon: 'text-rose-600'
  },
  kitchen: {
    active: 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 rounded-r-2xl rounded-l-none',
    hover: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    dotActive: 'bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.8)]',
    dotHover: 'group-hover:bg-indigo-500',
    textGradient: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent',
    ambientBg: 'bg-indigo-100/25',
    activeIcon: 'text-indigo-600'
  },
  admin: {
    active: 'bg-amber-50 text-amber-800 border-l-4 border-amber-600 rounded-r-2xl rounded-l-none',
    hover: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    dotActive: 'bg-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    dotHover: 'group-hover:bg-amber-500',
    textGradient: 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 bg-clip-text text-transparent',
    ambientBg: 'bg-amber-100/25',
    activeIcon: 'text-amber-700'
  },
  analytics: {
    active: 'bg-purple-50 text-purple-700 border-l-4 border-purple-600 rounded-r-2xl rounded-l-none',
    hover: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    dotActive: 'bg-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
    dotHover: 'group-hover:bg-purple-500',
    textGradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent',
    ambientBg: 'bg-purple-100/25',
    activeIcon: 'text-purple-600'
  }
};

const getAllowedModules = (role) => {
  switch (role) {
    case 'Admin':
    case 'Manager':
      return ['pos', 'menu', 'inventory', 'orders', 'kitchen', 'admin', 'analytics'];
    case 'Waiter':
    case 'Kitchen Staff':
    default:
      return ['pos', 'menu', 'inventory', 'orders', 'kitchen'];
  }
};

const MainDashboardShell = ({ loggedInStaff, onLogout }) => {
  const [activeModule, setActiveModule] = usePersistentState('aura_activeModule', 'pos');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState('aura_sidebarCollapsed', false);

  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const [toastState, setToastState] = useState({
    isOpen: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    if (toastState.isOpen) {
      const timer = setTimeout(() => {
        setToastState(prev => ({ ...prev, isOpen: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastState.isOpen]);

  const triggerConfirm = (title, message) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const triggerToast = (message, type = 'success') => {
    setToastState({
      isOpen: true,
      message,
      type
    });
  };

  const matchedStaff = staffList.find(s => 
    s.username?.toLowerCase() === loggedInStaff?.staff_name?.toLowerCase() ||
    s.staff_name?.toLowerCase() === loggedInStaff?.staff_name?.toLowerCase()
  );

  const staff = {
    ...(loggedInStaff || { staff_name: 'Staff', role: 'User' }),
    ...(matchedStaff || { staff_id: staffList[0]?.staff_id || 1 })
  };

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const allowedIds = getAllowedModules(staff.role);

  useEffect(() => {
    const allowed = getAllowedModules(staff.role);
    if (!allowed.includes(activeModule)) {
      setActiveModule(allowed[0] || 'pos');
    }
  }, [staff.role]);

  const handleChangeOwnPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      triggerToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      triggerToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/staff/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staff.staff_id,
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      triggerToast('Password updated successfully');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const fetchBootstrap = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setLoadError(null);
      const response = await fetch('/api/bootstrap');
      if (!response.ok) {
        throw new Error('Unable to load data from server');
      }
      const data = await response.json();
      setCustomers(data.customers || []);
      setStaffList(data.staffList || []);
      setCategories(data.categories || []);
      setInventory(data.inventory || []);
      setMenuItems(data.menuItems || []);
      setOrders(data.orders || []);
      setOrderItems(data.orderItems || []);
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Bootstrap load failed:', error);
      setLoadError(error.message || 'Failed to load data');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  const refreshData = async () => {
    await fetchBootstrap(true);
  };

  const handlePlaceOrder = async (newOrderData) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrderData),
    });

    if (!response.ok) {
      throw new Error('Failed to place order');
    }

    await refreshData();
  };

  const handleAddMenuItem = async (newItemData) => {
    const response = await fetch('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItemData),
    });

    if (!response.ok) {
      throw new Error('Failed to save menu item');
    }

    await refreshData();
  };

  const handleUpdateMenuItem = async (updatedItemData) => {
    const response = await fetch(`/api/menu-items/${updatedItemData.menu_item_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItemData),
    });

    if (!response.ok) {
      throw new Error('Failed to update menu item');
    }

    await refreshData();
  };

  const handleToggleMenuAvailability = async (menu_item_id) => {
    const selected = menuItems.find((item) => item.menu_item_id === menu_item_id);
    if (!selected) return;

    await handleUpdateMenuItem({
      ...selected,
      availability_status: selected.availability_status === 'Available' ? 'Unavailable' : 'Available',
    });
  };

  const handleDeleteMenuItem = async (menu_item_id) => {
    const response = await fetch(`/api/menu-items/${menu_item_id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete menu item');
    }

    await refreshData();
  };

  // Customer Operations
  const handleAddCustomer = async (newCustomerData) => {
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomerData),
    });
    if (!response.ok) throw new Error('Failed to save customer');
    await refreshData();
  };

  const handleUpdateCustomer = async (updatedCustomerData) => {
    const response = await fetch(`/api/customers/${updatedCustomerData.customer_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCustomerData),
    });
    if (!response.ok) throw new Error('Failed to update customer');
    await refreshData();
  };

  const handleDeleteCustomer = async (customer_id) => {
    const response = await fetch(`/api/customers/${customer_id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete customer');
    }
    await refreshData();
  };

  // Staff Operations
  const handleAddStaff = async (newStaffData) => {
    const response = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaffData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to save staff account');
    }
    await refreshData();
  };

  const handleUpdateStaff = async (updatedStaffData) => {
    const response = await fetch(`/api/staff/${updatedStaffData.staff_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedStaffData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update staff account');
    }
    await refreshData();
  };

  const handleDeleteStaff = async (staff_id) => {
    const response = await fetch(`/api/staff/${staff_id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete staff account');
    await refreshData();
  };

  // Category Operations
  const handleAddCategory = async (newCategoryData) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategoryData),
    });
    if (!response.ok) throw new Error('Failed to save category');
    await refreshData();
  };

  const handleUpdateCategory = async (updatedCategoryData) => {
    const response = await fetch(`/api/categories/${updatedCategoryData.category_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCategoryData),
    });
    if (!response.ok) throw new Error('Failed to rename category');
    await refreshData();
  };

  const handleDeleteCategory = async (category_id) => {
    const response = await fetch(`/api/categories/${category_id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete category');
    }
    await refreshData();
  };

  const handleAddInventory = async (newInventoryData) => {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInventoryData),
    });

    if (!response.ok) {
      throw new Error('Failed to save inventory item');
    }

    await refreshData();
  };

  const handleUpdateInventory = async (updatedInventoryData) => {
    const response = await fetch(`/api/inventory/${updatedInventoryData.inventory_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedInventoryData),
    });

    if (!response.ok) {
      throw new Error('Failed to update inventory item');
    }

    await refreshData();
  };

  const handleDeleteInventory = async (inventory_id) => {
    const response = await fetch(`/api/inventory/${inventory_id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete inventory item');
    }

    await refreshData();
  };

  const handleUpdateOrderStatus = async (order_id, newStatus) => {
    const response = await fetch(`/api/orders/${order_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status: newStatus }),
    });

    if (!response.ok) {
      throw new Error('Failed to update order status');
    }

    await refreshData();
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-950">
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} shrink-0 border-r border-slate-200 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.015)] relative z-20 transition-all duration-300`}>
        <div className={`relative ${isSidebarCollapsed ? 'px-3 pt-16 pb-6 flex flex-col items-center' : 'px-8 py-10'}`}>
          <div className="flex items-center gap-4">
            <div className={`flex ${isSidebarCollapsed ? 'h-8 w-14' : 'h-14 w-24'} items-center justify-center rounded-2xl bg-white shadow-lg shadow-rose-100/50 overflow-hidden shrink-0 border border-slate-100 transition-all duration-300`}>
              <img src={auraLogo} alt="Aura Ilham Logo" className="w-full h-full object-contain p-1" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-rose-600 mb-0.5">Aura Ilham</p>
                <h2 className="text-sm font-black text-slate-900 tracking-tight leading-tight">Restaurant Suite</h2>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none hover:text-slate-900"
            aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
          >
            <svg className={`h-5 w-5 transition-transform duration-300 ${isSidebarCollapsed ? '' : 'rotate-180'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <nav className={`flex-1 ${isSidebarCollapsed ? 'px-2' : 'px-5'} space-y-2`}>
          {navigationList.filter(item => allowedIds.includes(item.id)).map((item) => {
            const isActive = activeModule === item.id;
            const config = tabConfig[item.id] || tabConfig.pos;
            const btnClass = `w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-4' : 'justify-between px-5 py-3.5'} rounded-2xl text-xs font-bold transition-all duration-200 group ${
              isActive ? config.active : config.hover
            }`;
            const iconClass = `w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
              isSidebarCollapsed ? '' : 'mr-3'
            } ${isActive ? (config.activeIcon || 'text-emerald-700') : 'text-slate-400 group-hover:text-slate-700'}`;

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={btnClass}
                aria-label={item.name}
              >
                <div className="flex items-center">
                  {item.icon(iconClass)}
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isActive ? config.dotActive : `bg-transparent ${config.dotHover}`
                  }`} />
                )}
              </button>
            );
          })}
          {isSidebarCollapsed && onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center rounded-2xl px-5 py-3.5 text-slate-500 hover:bg-rose-50 hover:text-rose-750 transition-all duration-200"
              title="Log Out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3v1" />
              </svg>
            </button>
          )}
        </nav>

        <div className={`${isSidebarCollapsed ? 'hidden' : 'p-6'}`}>
          <div className="rounded-[24px] bg-gradient-to-br from-emerald-50/60 via-white to-rose-50/40 p-5 border border-emerald-100/60 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-700">Active Shift</p>
              <button 
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="text-slate-400 hover:text-emerald-600 transition" 
                title="Change Account Password"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center text-xs font-black border border-white shadow-md shadow-emerald-100/50 shrink-0">
                {staff.staff_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{staff.staff_name}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{staff.role}</p>
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="mt-4 w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition text-[11px] font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3v1" />
                </svg>
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-hidden">
        {/* Top border line */}
        <div className="h-[1px] bg-slate-200/80 w-full shrink-0"></div>

        {/* Ambient background highlight */}
        <div className={`absolute -top-20 -right-20 w-[400px] h-[400px] ${(tabConfig[activeModule] || tabConfig.pos).ambientBg} rounded-full blur-3xl pointer-events-none -z-10`} />

        <header className="px-8 py-6 flex justify-between items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-1">
              {navigationList.find((n) => n.id === activeModule)?.name}
            </p>
            <h1 className={`text-3xl font-black tracking-tight ${tabConfig[activeModule]?.textGradient || 'text-slate-900'}`}>
              {activeModule === 'pos' && 'Point of Sale'}
              {activeModule === 'menu' && 'Menu Catalog'}
              {activeModule === 'inventory' && 'Stock Management'}
              {activeModule === 'orders' && 'Order Overview'}
              {activeModule === 'kitchen' && 'Kitchen Station'}
              {activeModule === 'admin' && 'Admin Console'}
              {activeModule === 'analytics' && 'Business Analytics'}
            </h1>
          </div>
 
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wide border border-emerald-200/50 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              SYSTEM ONLINE
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-8 pb-8">
          <div className="h-full max-w-[1600px] mx-auto">
            {isLoading && (
              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-10 shadow-sm text-center text-slate-500">
                Loading data...
              </div>
            )}

            {loadError && (
              <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 shadow-sm text-rose-700">
                <p className="font-semibold">Unable to connect to the server.</p>
                <p className="text-sm mt-2">{loadError}</p>
              </div>
            )}

            {!isLoading && !loadError && (
              <>
                {activeModule === 'pos' && (
                  <POSSystem
                    menuItems={menuItems}
                    categories={categories}
                    customers={customers}
                    orders={orders}
                    staffList={staffList}
                    loggedInStaff={staff}
                    onPlaceOrder={handlePlaceOrder}
                    showConfirm={triggerConfirm}
                    showToast={triggerToast}
                  />
                )}

                {activeModule === 'menu' && (
                  <MenuManagement
                    menuItems={menuItems}
                    categories={categories}
                    onAddMenuItem={handleAddMenuItem}
                    onUpdateMenuItem={handleUpdateMenuItem}
                    onToggleAvailability={handleToggleMenuAvailability}
                    onDeleteMenuItem={handleDeleteMenuItem}
                    showConfirm={triggerConfirm}
                    showToast={triggerToast}
                  />
                )}

                {activeModule === 'inventory' && (
                  <Inventory
                    inventory={inventory}
                    onAddInventory={handleAddInventory}
                    onUpdateInventory={handleUpdateInventory}
                    onDeleteInventory={handleDeleteInventory}
                    showConfirm={triggerConfirm}
                    showToast={triggerToast}
                  />
                )}

                {activeModule === 'orders' && (
                  <OrderHistory
                    orders={orders}
                    orderItems={orderItems}
                    payments={payments}
                    customers={customers}
                    staffList={staffList}
                    menuItems={menuItems}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    showConfirm={triggerConfirm}
                    showToast={triggerToast}
                  />
                )}

                {activeModule === 'kitchen' && (
                  <KitchenDisplay
                    orders={orders}
                    orderItems={orderItems}
                    menuItems={menuItems}
                    categories={categories}
                    customers={customers}
                    staffList={staffList}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    showConfirm={triggerConfirm}
                    showToast={triggerToast}
                  />
                )}

                {activeModule === 'admin' && (
                  <AdminConsole
                    customers={customers}
                    staffList={staffList}
                    categories={categories}
                    orders={orders}
                    orderItems={orderItems}
                    menuItems={menuItems}
                    onAddCustomer={handleAddCustomer}
                    onUpdateCustomer={handleUpdateCustomer}
                    onDeleteCustomer={handleDeleteCustomer}
                    onAddStaff={handleAddStaff}
                    onUpdateStaff={handleUpdateStaff}
                    onDeleteStaff={handleDeleteStaff}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                    showConfirm={triggerConfirm}
                    showToast={triggerToast}
                  />
                )}

                {activeModule === 'analytics' && (
                  <AnalyticsPanel
                    orders={orders}
                    orderItems={orderItems}
                    payments={payments}
                    customers={customers}
                    staffList={staffList}
                    menuItems={menuItems}
                    categories={categories}
                    inventory={inventory}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <svg className="w-6 h-6 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{confirmState.title}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Please confirm your action</p>
              </div>
            </div>
            
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line py-2">
              {confirmState.message}
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={confirmState.onCancel}
                className="px-5 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmState.onConfirm}
                className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transition shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Success Toast */}
      {toastState.isOpen && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-white border border-emerald-100 shadow-2xl shadow-emerald-100/30 px-5 py-4 rounded-2xl animate-slide-in min-w-[320px]">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">{toastState.message}</p>
            <p className="text-[10px] font-semibold text-slate-400">Success</p>
          </div>
        </div>
      )}

      {/* Self-Service Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="w-6 h-6 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Secure your employee account</p>
              </div>
            </div>

            <form onSubmit={handleChangeOwnPassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="•••••••• (Min 8 chars)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input 
                  type="password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transition shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainDashboardShell;
