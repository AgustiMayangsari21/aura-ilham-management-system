import React from 'react';

const AnalyticsPanel = ({
  orders,
  orderItems,
  payments,
  customers,
  staffList,
  menuItems,
  categories,
  inventory
}) => {
  
  // 1. Core Financial Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const totalOrdersCount = orders.length;
  const completedOrders = orders.filter(o => o.order_status === 'Completed');
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  
  // 2. Sales by Category calculation
  const categorySales = categories.map(cat => {
    // Find all menu items belonging to this category
    const categoryMenuIds = menuItems
      .filter(m => m.category_id === cat.category_id)
      .map(m => m.menu_item_id);
    
    // Sum subtotal of order items matching these menu items
    const revenue = orderItems
      .filter(oi => categoryMenuIds.includes(oi.menu_item_id))
      .reduce((sum, oi) => sum + parseFloat(oi.subtotal), 0);

    return {
      category_name: cat.category_name,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const maxCategoryRevenue = Math.max(...categorySales.map(c => c.revenue), 1);

  // 3. Payment Method Metrics
  const paymentMethods = ['Cash', 'QR Code', 'Online Transfer'].map(method => {
    const matchingPayments = payments.filter(p => p.payment_method === method);
    const total = matchingPayments.reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);
    return {
      method,
      count: matchingPayments.length,
      total
    };
  });

  const totalPaymentsAmt = payments.reduce((sum, p) => sum + parseFloat(p.payment_amount), 1);

  // 4. Staff Performance leaderboard
  const staffLeaderboard = staffList.map(staff => {
    const staffOrders = orders.filter(o => o.staff_id === staff.staff_id);
    const salesVolume = staffOrders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
    return {
      staff_name: staff.staff_name,
      role: staff.role,
      ordersCount: staffOrders.length,
      salesVolume
    };
  }).sort((a, b) => b.salesVolume - a.salesVolume);

  // 5. Low-Stock Alerts
  const lowStockItems = inventory.filter(item => 
    parseFloat(item.quantity) <= parseFloat(item.min_threshold)
  );

  return (
    <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Top Level Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/10 rounded-2xl border border-emerald-100/60 shadow-sm p-5 hover:shadow-md hover:border-emerald-200 transition relative overflow-hidden">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Gross Revenue</p>
          <h3 className="text-2xl font-black text-slate-900">RM {totalRevenue.toFixed(2)}</h3>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Sales Logged
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/10 rounded-2xl border border-indigo-100/60 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition relative overflow-hidden">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1.5">Total Orders</p>
          <h3 className="text-2xl font-black text-slate-900">{totalOrdersCount}</h3>
          <p className="text-[10px] text-indigo-500 font-semibold mt-1">
            {completedOrders.length} Completed, {orders.filter(o => o.order_status !== 'Completed').length} Active
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50/60 via-white to-amber-50/10 rounded-2xl border border-amber-100/60 shadow-sm p-5 hover:shadow-md hover:border-amber-200 transition relative overflow-hidden">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">Avg. Ticket Value</p>
          <h3 className="text-2xl font-black text-slate-900">RM {avgOrderValue.toFixed(2)}</h3>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">Per transaction average</p>
        </div>

        <div className={`rounded-2xl border shadow-sm p-5 hover:shadow-md transition relative overflow-hidden ${
          lowStockItems.length > 0 
            ? 'bg-gradient-to-br from-rose-50/60 via-white to-rose-50/10 border-rose-100/60 hover:border-rose-200' 
            : 'bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/10 border-emerald-100/60 hover:border-emerald-200'
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Low Stock Warnings</p>
          <h3 className={`text-2xl font-black ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {lowStockItems.length}
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Ingredients below threshold</p>
        </div>
      </div>

      {/* Analytics Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Category Sales Breakdown */}
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 flex flex-col min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Revenue by Menu Category</h3>
            <p className="text-xs text-slate-500">Breakdown of gross revenue generated in each menu category.</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {categorySales.map(cat => {
              const percentage = (cat.revenue / maxCategoryRevenue) * 100;
              return (
                <div key={cat.category_name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{cat.category_name}</span>
                    <span className="text-emerald-600">RM {cat.revenue.toFixed(2)}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Leaderboard */}
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 flex flex-col min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Employee Sales Leaderboard</h3>
            <p className="text-xs text-slate-500">Waiters ranked by order volumes and sales performance values.</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="text-slate-400 uppercase tracking-wider text-[9px] border-b border-slate-100">
                <tr>
                  <th className="pb-3 font-bold">Rank</th>
                  <th className="pb-3 font-bold">Staff Name</th>
                  <th className="pb-3 font-bold">Role</th>
                  <th className="pb-3 font-bold text-center">Orders Taken</th>
                  <th className="pb-3 font-bold text-right">Sales Vol. (RM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffLeaderboard.map((staff, idx) => (
                  <tr key={staff.staff_name} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-black text-slate-400">#{idx + 1}</td>
                    <td className="py-3 font-bold text-slate-900">{staff.staff_name}</td>
                    <td className="py-3 text-slate-500 font-semibold">{staff.role}</td>
                    <td className="py-3 text-center font-bold text-slate-700">{staff.ordersCount}</td>
                    <td className="py-3 text-right font-extrabold text-emerald-600">
                      {staff.salesVolume.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 flex flex-col min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Payment Channel Performance</h3>
            <p className="text-xs text-slate-500">Volume and counts logged per payment method configuration.</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {paymentMethods.map(pm => {
              const sharePercent = (pm.total / totalPaymentsAmt) * 100;
              return (
                <div key={pm.method} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      {pm.method === 'Cash' && (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {pm.method === 'QR Code' && (
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      )}
                      {pm.method === 'Online Transfer' && (
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{pm.method}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{pm.count} Transactions ({sharePercent.toFixed(1)}% Share)</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs text-slate-900">RM {pm.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Alerts (Low Stock warnings) */}
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 flex flex-col min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Critical Ingredient Warnings</h3>
            <p className="text-xs text-slate-500">Active stock items currently at or below minimum threshold levels.</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full">
                <svg className="w-12 h-12 stroke-[1.5] text-emerald-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <p className="text-xs font-bold text-slate-700">All Stocks Sufficient</p>
                <p className="text-[10px] text-slate-400">No ingredient stock alerts currently active.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="text-slate-400 uppercase tracking-wider text-[9px] border-b border-slate-100">
                  <tr>
                    <th className="pb-3 font-bold">Ingredient</th>
                    <th className="pb-3 font-bold text-center">Current</th>
                    <th className="pb-3 font-bold text-center">Minimum</th>
                    <th className="pb-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map(item => {
                    const currentVal = parseFloat(item.quantity);
                    const minVal = parseFloat(item.min_threshold);
                    return (
                      <tr key={item.inventory_id} className="hover:bg-rose-50/50 transition">
                        <td className="py-3 font-bold text-slate-900">{item.inventory_name}</td>
                        <td className="py-3 text-center font-bold text-rose-600">{currentVal.toFixed(2)} {item.unit}</td>
                        <td className="py-3 text-center text-slate-500 font-semibold">{minVal.toFixed(2)} {item.unit}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            currentVal <= 0 
                              ? 'bg-slate-100 border-slate-200 text-slate-700' 
                              : 'bg-rose-50 border-rose-100 text-rose-700'
                          }`}>
                            {currentVal <= 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPanel;
