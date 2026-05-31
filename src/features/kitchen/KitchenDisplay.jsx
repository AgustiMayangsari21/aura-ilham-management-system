import React, { useState, useEffect } from 'react';

const KitchenDisplay = ({ 
  orders, 
  orderItems, 
  menuItems, 
  categories, 
  customers, 
  staffList, 
  onUpdateOrderStatus, 
  showConfirm, 
  showToast 
}) => {
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'preparing', 'ready'
  const [checkedItems, setCheckedItems] = useState({});
  const [ticker, setTicker] = useState(0);

  // Re-render periodically to update the elapsed timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 15000); // update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = (orderDateStr) => {
    const orderDate = new Date(orderDateStr);
    const now = new Date();
    const diffMs = now - orderDate;
    const diffMins = Math.floor(diffMs / 60000);
    return Math.max(0, diffMins);
  };

  const formatElapsedTime = (mins) => {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const getTimerClass = (mins) => {
    if (mins >= 15) return 'bg-rose-500 text-white animate-pulse border-rose-400/20';
    if (mins >= 10) return 'bg-amber-500 text-white border-amber-400/20';
    return 'bg-slate-950/30 text-white/90 border-white/10';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'from-amber-500 to-orange-600';
      case 'Preparing':
        return 'from-blue-500 to-indigo-600';
      case 'Ready':
        return 'from-emerald-500 to-teal-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const handleCheckboxToggle = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleActionClick = async (orderId, currentStatus) => {
    let nextStatus = '';
    let confirmTitle = '';
    let confirmMsg = '';

    if (currentStatus === 'Pending') {
      nextStatus = 'Preparing';
      confirmTitle = 'Start Preparing';
      confirmMsg = `Are you sure you want to start preparing Order #${orderId}?`;
    } else if (currentStatus === 'Preparing') {
      nextStatus = 'Ready';
      confirmTitle = 'Mark as Ready';
      confirmMsg = `Mark Order #${orderId} as Ready for pick-up/serving?`;
    }

    if (!nextStatus) return;

    const confirmed = await showConfirm(confirmTitle, confirmMsg);
    if (!confirmed) return;

    try {
      await onUpdateOrderStatus(orderId, nextStatus);
      showToast(`Order #${orderId} updated to ${nextStatus}`);
    } catch (err) {
      showToast(`Failed to update Order #${orderId}.`, 'error');
    }
  };

  // Map orders to their details
  const decoratedOrders = orders.map(order => {
    const customer = customers.find(c => c.customer_id === order.customer_id);
    const staff = staffList.find(s => s.staff_id === order.staff_id);
    const items = orderItems
      .filter(oi => oi.order_id === order.order_id)
      .map(item => ({
        ...item,
        menu_name: menuItems.find(m => m.menu_item_id === item.menu_item_id)?.menu_name || `Item #${item.menu_item_id}`
      }));

    return {
      ...order,
      customerName: order.customer_id === 1 ? 'Walk-in Guest' : (customer?.customer_name || 'Walk-in Guest'),
      staffName: staff?.staff_name || 'Waiter',
      items,
      elapsedMins: getElapsedTime(order.order_date)
    };
  });

  // Filter orders based on active tab
  const filteredOrders = decoratedOrders.filter(order => {
    if (activeTab === 'active') {
      return order.order_status === 'Pending' || order.order_status === 'Preparing';
    }
    if (activeTab === 'pending') {
      return order.order_status === 'Pending';
    }
    if (activeTab === 'preparing') {
      return order.order_status === 'Preparing';
    }
    if (activeTab === 'ready') {
      return order.order_status === 'Ready';
    }
    return false;
  }).sort((a, b) => {
    // Sort oldest tickets first for active cooking, newest first for recently completed
    if (activeTab === 'ready') {
      return new Date(b.order_date) - new Date(a.order_date);
    }
    return new Date(a.order_date) - new Date(b.order_date);
  });

  // Count metrics
  const pendingCount = decoratedOrders.filter(o => o.order_status === 'Pending').length;
  const preparingCount = decoratedOrders.filter(o => o.order_status === 'Preparing').length;
  const readyCount = decoratedOrders.filter(o => o.order_status === 'Ready').length;

  return (
    <div className="h-full flex flex-col gap-6 w-full">
      {/* Header Tabs & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'active' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Active ({pendingCount + preparingCount})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'pending' 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('preparing')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'preparing' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preparing ({preparingCount})
          </button>
          <button
            onClick={() => setActiveTab('ready')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'ready' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ready ({readyCount})
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pr-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Preparing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Ready</span>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[28px] border border-slate-200 text-slate-400 h-96">
            <svg className="w-16 h-16 stroke-[1.5] mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-9 3h10M9 13h10M9 17h10" />
            </svg>
            <p className="text-sm font-semibold">No orders currently in this status.</p>
            <p className="text-xs text-slate-400 mt-1">New incoming orders will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredOrders.map(order => (
              <div 
                key={order.order_id} 
                className="bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md hover:border-slate-300 min-h-[320px]"
              >
                {/* Ticket Header */}
                <div className={`bg-gradient-to-r ${getStatusColor(order.order_status)} p-4 text-white flex flex-col gap-2 relative border-b border-black/5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black tracking-wider">#{order.order_id.toString().padStart(4, '0')}</span>
                    {/* Time Counter Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${getTimerClass(order.elapsedMins)}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span>{formatElapsedTime(order.elapsedMins)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border border-white/20 ${
                      order.order_type === 'Takeaway' ? 'bg-rose-700/40 text-rose-100' : 'bg-emerald-700/40 text-emerald-100'
                    }`}>
                      {order.order_type}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-white/20 bg-slate-950/20 text-white/90">
                      {order.order_status}
                    </span>
                  </div>
                </div>

                {/* Customer and Staff Bar */}
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {order.customerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {order.staffName}
                  </span>
                </div>

                {/* Order Items list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {order.items.map((item, idx) => {
                    const checkKey = `${order.order_id}-${idx}`;
                    const isChecked = !!checkedItems[checkKey];

                    const menuItem = menuItems.find(m => m.menu_item_id === item.menu_item_id);
                    const category = categories?.find(c => c.category_id === menuItem?.category_id);
                    const catName = category?.category_name?.toLowerCase() || '';

                    let dotClass = 'bg-emerald-500 shadow-sm shadow-emerald-250';
                    let titleText = 'Mains';

                    if (catName.includes('drink') || catName.includes('beverage') || catName.includes('air') || catName.includes('ais')) {
                      dotClass = 'bg-teal-500 shadow-sm shadow-teal-250';
                      titleText = 'Drinks';
                    } else if (catName.includes('tomyum') || catName.includes('tom yam') || catName.includes('soup') || catName.includes('sup')) {
                      dotClass = 'bg-rose-500 shadow-sm shadow-rose-250';
                      titleText = 'Soup/Tomyum';
                    } else if (catName.includes('rice') || catName.includes('nasi') || catName.includes('noodle') || catName.includes('mee') || catName.includes('main')) {
                      dotClass = 'bg-amber-500 shadow-sm shadow-amber-250';
                      titleText = 'Rice/Noodles';
                    }

                    return (
                      <div 
                        key={item.order_item_id} 
                        className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-b-0"
                      >
                        <input 
                          type="checkbox"
                          id={checkKey}
                          checked={isChecked}
                          onChange={() => handleCheckboxToggle(order.order_id, idx)}
                          className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-0.5"
                        />
                        <label 
                          htmlFor={checkKey} 
                          className={`flex-1 text-sm font-bold cursor-pointer flex justify-between gap-2 items-center leading-tight transition-all duration-200 ${
                            isChecked ? 'line-through text-slate-400 opacity-60' : 'text-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${dotClass} shrink-0`} title={titleText} />
                            <span>{item.menu_name}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded font-extrabold text-xs transition border ${
                            isChecked 
                              ? 'bg-slate-100 text-slate-400 border-slate-200' 
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            x{item.quantity}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>

                {/* Action Footer */}
                {order.order_status !== 'Ready' && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                    <button
                      onClick={() => handleActionClick(order.order_id, order.order_status)}
                      className={`w-full py-2.5 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition flex items-center justify-center gap-2 bg-gradient-to-r ${
                        order.order_status === 'Pending' 
                          ? 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                          : 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                      }`}
                    >
                      {order.order_status === 'Pending' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          <span>START PREPARING</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>MARK AS READY</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;
