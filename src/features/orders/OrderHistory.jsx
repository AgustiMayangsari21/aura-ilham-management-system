import React, { useState } from 'react';
import { printReceipt } from '../pos/printHelper';
import PaymentResult from '../pos/PaymentResult';

const OrderHistory = ({ orders, orderItems, payments, customers, staffList, menuItems, onUpdateOrderStatus, showConfirm, showToast }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState(null);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'Ready': return 'bg-emerald-100 text-emerald-700';
      case 'Preparing': return 'bg-slate-100 text-slate-700';
      case 'Pending': default: return 'bg-rose-100 text-rose-700';
    }
  };

  const selectedOrderDetails = selectedOrder ? {
    ...selectedOrder,
    customer: customers.find(c => c.customer_id === selectedOrder.customer_id),
    staff: staffList.find(s => s.staff_id === selectedOrder.staff_id),
    items: orderItems.filter(oi => oi.order_id === selectedOrder.order_id).map(oi => ({
      ...oi,
      menu_name: menuItems.find(m => m.menu_item_id === oi.menu_item_id)?.menu_name
    })),
    payment: payments.find(p => p.order_id === selectedOrder.order_id)
  } : null;

  const handleViewReceipt = () => {
    if (!selectedOrderDetails) return;
    
    const receiptData = {
      orderItems: selectedOrderDetails.items.map(item => ({
        quantity: item.quantity,
        menu_name: item.menu_name || `Item #${item.menu_item_id}`,
        subtotal: item.subtotal,
        price: item.subtotal / item.quantity
      })),
      timestamp: new Date(selectedOrderDetails.order_date).toLocaleString(),
      transactionId: `TXN-${new Date(selectedOrderDetails.order_date).getFullYear()}${(new Date(selectedOrderDetails.order_date).getMonth() + 1).toString().padStart(2, '0')}${new Date(selectedOrderDetails.order_date).getDate().toString().padStart(2, '0')}-${selectedOrderDetails.order_id.toString().padStart(4, '0')}`,
      totalAmount: selectedOrderDetails.total_amount,
      amountPaid: selectedOrderDetails.payment?.payment_amount || selectedOrderDetails.total_amount,
      balanceDue: Math.max(0, (selectedOrderDetails.payment?.payment_amount || selectedOrderDetails.total_amount) - selectedOrderDetails.total_amount),
      cashierName: selectedOrderDetails.staff?.staff_name || 'Active Staff',
      customerName: selectedOrderDetails.customer_id === 1 ? 'Walk-in Guest' : (selectedOrderDetails.customer?.customer_name || 'Walk-in Guest')
    };
    
    setViewingReceiptOrder(receiptData);
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full gap-6">
      {/* Revenue Dashboard */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Revenue</p>
            <h3 className="text-xl font-black text-slate-900">RM {orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Orders</p>
            <h3 className="text-xl font-black text-slate-900">{orders.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm">
            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>
          <div>
            <p className="text-[10px] font-bold text-rose-600/70 uppercase tracking-wider mb-0.5">Pending Orders</p>
            <h3 className="text-xl font-black text-rose-600">{orders.filter(o => o.order_status === 'Pending').length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider mb-0.5">Completed</p>
            <h3 className="text-xl font-black text-emerald-600">{orders.filter(o => o.order_status === 'Completed').length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Order History</h2>
          <p className="text-sm text-slate-500 mt-1">Review past transactions and update current order statuses.</p>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Orders List */}
        <div className={`flex-1 overflow-y-auto border-r border-slate-200 ${selectedOrder ? 'hidden lg:block' : 'block'}`}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Order ID</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Date</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Type</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Total (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.sort((a,b) => b.order_id - a.order_id).map(order => (
                <tr 
                  key={order.order_id} 
                  onClick={() => setSelectedOrder(order)}
                  className={`cursor-pointer transition ${selectedOrder?.order_id === order.order_id ? 'bg-emerald-50/70 border-l-4 border-emerald-500' : 'hover:bg-slate-50/80'}`}
                >
                  <td className="px-6 py-4 font-bold text-emerald-600">#{order.order_id.toString().padStart(4, '0')}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {new Date(order.order_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{order.order_type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {order.total_amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Details Panel */}
        {selectedOrderDetails && (
          <div className="w-full lg:w-[450px] bg-slate-50/30 flex flex-col h-full overflow-hidden shrink-0">
            <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-start relative">
              <div>
                <button onClick={() => setSelectedOrder(null)} className="lg:hidden text-emerald-600 text-sm font-bold mb-2">&larr; Back to list</button>
                <h3 className="text-lg font-bold text-slate-900">Order #{selectedOrderDetails.order_id.toString().padStart(4, '0')}</h3>
                <p className="text-sm text-slate-500 font-medium">{new Date(selectedOrderDetails.order_date).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 pr-8">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedOrderDetails.order_status)}`}>
                  {selectedOrderDetails.order_status}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedOrder(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all duration-150 hover:scale-110 active:scale-95"
                title="Close Details"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Update Timeline */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-6">Order Progress</label>
                <div className="relative flex justify-between items-center px-2">
                  <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0"></div>
                  {['Pending', 'Preparing', 'Ready', 'Completed'].map((status, idx, arr) => {
                    const statusIndex = arr.indexOf(selectedOrderDetails.order_status);
                    const isPast = idx < statusIndex;
                    const isActive = idx === statusIndex;
                    
                    return (
                      <button
                        key={status}
                        onClick={async () => {
                          const confirmed = await showConfirm(
                            'Update Order Status',
                            `Update status of Order #${selectedOrderDetails.order_id.toString().padStart(4, '0')} to "${status}"?`
                          );
                          if (confirmed) {
                            try {
                              await onUpdateOrderStatus(selectedOrderDetails.order_id, status);
                              showToast(`Order status updated to "${status}"`);
                            } catch (err) {
                              showToast('Failed to update order status.', 'error');
                            }
                          }
                        }}
                        className={`relative z-10 flex flex-col items-center gap-3 group outline-none`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-300 ${
                          isActive 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200 scale-125' 
                            : isPast 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'bg-white border-slate-200 text-slate-400 group-hover:border-emerald-300'
                        }`}>
                          {isPast ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : idx + 1}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          isActive ? 'text-emerald-600' : isPast ? 'text-slate-800' : 'text-slate-400'
                        }`}>
                          {status}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer</p>
                    <p className="font-semibold text-slate-900">{selectedOrderDetails.customer_id === 1 ? 'Walk-in Guest' : (selectedOrderDetails.customer?.customer_name || 'Walk-in Guest')}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Staff</p>
                    <p className="font-semibold text-slate-900">{selectedOrderDetails.staff?.staff_name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Order Type</p>
                    <p className="font-semibold text-slate-900">{selectedOrderDetails.order_type}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">Order Items</p>
                <div className="space-y-3">
                  {selectedOrderDetails.items.map(item => (
                    <div key={item.order_item_id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{item.quantity}x</span>
                        <span className="font-semibold text-slate-900">{item.menu_name || `Item #${item.menu_item_id}`}</span>
                      </div>
                      <span className="font-bold text-slate-900">RM {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Total</span>
                  <span className="text-xl font-bold text-emerald-600">RM {selectedOrderDetails.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              {selectedOrderDetails.payment && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">Payment Details</p>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-slate-600">Method</span>
                    <span className="font-bold text-slate-900">{selectedOrderDetails.payment.payment_method}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-600">Date</span>
                    <span className="font-medium text-slate-900">{new Date(selectedOrderDetails.payment.payment_date).toLocaleString()}</span>
                  </div>
                </div>
              )}

            </div>
            
            {/* Sticky Sidebar Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200">
              <button
                type="button"
                onClick={handleViewReceipt}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-100 hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Receipt</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal Overlay */}
      {viewingReceiptOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="my-8 w-full max-w-md relative">
            <PaymentResult
              status="success"
              totalAmount={viewingReceiptOrder.totalAmount}
              amountPaid={viewingReceiptOrder.amountPaid}
              balanceDue={viewingReceiptOrder.balanceDue}
              transactionId={viewingReceiptOrder.transactionId}
              timestamp={viewingReceiptOrder.timestamp}
              cashierName={viewingReceiptOrder.cashierName}
              customerName={viewingReceiptOrder.customerName}
              orderItems={viewingReceiptOrder.orderItems}
              onPrint={(data) => {
                printReceipt(data);
                showToast('Receipt sent to printer!');
              }}
              onClose={() => setViewingReceiptOrder(null)}
            />
            <button 
              type="button" 
              onClick={() => setViewingReceiptOrder(null)}
              className="absolute top-4 right-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-150 hover:scale-110 active:scale-95 z-50 no-print"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default OrderHistory;
