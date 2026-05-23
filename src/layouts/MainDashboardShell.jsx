import React, { useState, useEffect } from 'react';
import POSSystem from '../features/pos/POSSystem';
import MenuManagement from '../features/menu/MenuManagement';
import Inventory from '../features/inventory/Inventory';
import OrderHistory from '../features/orders/OrderHistory';
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
    active: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200/40',
    hover: 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-700',
    dotActive: 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]',
    dotHover: 'group-hover:bg-emerald-400',
    textGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent',
  },
  menu: {
    active: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200/40',
    hover: 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-700',
    dotActive: 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]',
    dotHover: 'group-hover:bg-emerald-400',
    textGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent',
  },
  inventory: {
    active: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200/40',
    hover: 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-700',
    dotActive: 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]',
    dotHover: 'group-hover:bg-emerald-400',
    textGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent',
  },
  orders: {
    active: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200/40',
    hover: 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-700',
    dotActive: 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]',
    dotHover: 'group-hover:bg-emerald-400',
    textGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent',
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
    <div className="flex h-screen bg-slate-100/50 text-slate-900 font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur-xl flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-20 transition-all duration-300`}>
        <div className={`relative ${isSidebarCollapsed ? 'px-3 pt-16 pb-6 flex flex-col items-center' : 'px-8 py-10'}`}>
          <div className="flex items-center gap-4">
            <div className={`flex ${isSidebarCollapsed ? 'h-8 w-14' : 'h-14 w-24'} items-center justify-center rounded-2xl bg-white shadow-lg shadow-rose-100/50 overflow-hidden shrink-0 border border-slate-100 transition-all duration-300`}>
              <img src={auraLogo} alt="Aura Ilham Logo" className="w-full h-full object-contain p-1" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-rose-600 mb-0.5">Aura Ilham</p>
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Restaurant Suite</h2>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none"
            aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Collapse sidebar'}
          >
            <svg className={`h-5 w-5 transition-transform duration-300 ${isSidebarCollapsed ? '' : 'rotate-180'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <nav className={`flex-1 ${isSidebarCollapsed ? 'px-2' : 'px-5'} space-y-2`}>
          {navigationList.map((item) => {
            const isActive = activeModule === item.id;
            const config = tabConfig[item.id] || tabConfig.pos;
            const btnClass = `w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-4' : 'justify-between px-5 py-3.5'} rounded-2xl text-sm font-bold transition-all duration-200 group ${
              isActive ? config.active : config.hover
            }`;
            const iconClass = `w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
              isSidebarCollapsed ? '' : 'mr-3'
            } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`;

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
              className="w-full flex items-center justify-center rounded-2xl px-5 py-3.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200"
              title="Log Out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3v1" />
              </svg>
            </button>
          )}
        </nav>

        <div className={`${isSidebarCollapsed ? 'hidden' : 'p-6'}`}>
          <div className="rounded-[24px] bg-gradient-to-br from-emerald-50/60 via-white to-rose-50/40 p-6 border border-emerald-100/60 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700">Active Shift</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center text-sm font-bold border-2 border-white shadow-md shadow-emerald-100/50 shrink-0">
                {staff.staff_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{staff.staff_name}</p>
                <p className="text-xs font-semibold text-slate-500">{staff.role}</p>
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="mt-4 w-full py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition text-xs font-bold flex items-center justify-center gap-2"
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

      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-50 via-emerald-50/10 to-rose-50/30 relative overflow-hidden">
        {/* Top Decorative Gradient Bar (Grab/Foodpanda Inspired) */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-rose-500 to-emerald-600 w-full shrink-0 animate-pulse"></div>

        {/* Ambient colorful background highlights */}
        <div className="absolute -top-20 -right-20 w-[450px] h-[450px] bg-emerald-200/35 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-rose-200/25 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-20 -right-10 w-[500px] h-[500px] bg-rose-100/15 rounded-full blur-3xl pointer-events-none -z-10" />

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
            </h1>
          </div>
 
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-700 text-xs font-extrabold tracking-wide border border-emerald-200/80 shadow-sm shadow-emerald-100/50 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
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
    </div>
  );
};

export default MainDashboardShell;
