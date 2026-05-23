import React, { useState, useEffect } from 'react';
import PaymentResult from './PaymentResult';
import { printReceipt } from './printHelper';

const POSSystem = ({ 
  menuItems, 
  categories, 
  customers, 
  staffList, 
  loggedInStaff,
  onPlaceOrder,
  showConfirm,
  showToast
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.category_id || 1);
  const [cart, setCart] = useState([]);
  
  // Payment Result State
  const [paymentResultState, setPaymentResultState] = useState(null);
  
  // Form State - adhering strictly to schema names
  const [order_type, setOrder_type] = useState('Dine-In'); // ENUM: 'Dine-In','Takeaway','Pre-Order'
  const [customer_id, setCustomer_id] = useState('');
  const [staff_id, setStaff_id] = useState(loggedInStaff?.staff_id || staffList[0]?.staff_id || 1);

  // Sync staff_id if logged-in session changes
  useEffect(() => {
    if (loggedInStaff?.staff_id) {
      setStaff_id(loggedInStaff.staff_id);
    }
  }, [loggedInStaff]);

  const [payment_method, setPayment_method] = useState('Cash'); // ENUM: 'Cash','QR Code','Online Transfer'
  const [payment_amount, setPayment_amount] = useState('');

  const displayedMenuItems = menuItems.filter(item => {
    const categoryMatch = selectedCategoryId === 'All' ? true : item.category_id === selectedCategoryId;
    return categoryMatch && item.availability_status === 'Available';
  });

  const addToCart = (menuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menu_item_id === menuItem.menu_item_id);
      if (existing) {
        return prev.map(item => 
          item.menu_item_id === menuItem.menu_item_id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * menuItem.price }
            : item
        );
      }
      return [...prev, { 
        menu_item_id: menuItem.menu_item_id, 
        menu_name: menuItem.menu_name,
        price: menuItem.price,
        quantity: 1, 
        subtotal: menuItem.price 
      }];
    });
  };

  const removeFromCart = (menuItemId) => {
    setCart(prev => prev.filter(item => item.menu_item_id !== menuItemId));
  };

  const decreaseQuantity = (menuItemId) => {
    setCart(prev => prev.map(item => {
      if (item.menu_item_id === menuItemId) {
        return { ...item, quantity: item.quantity - 1, subtotal: (item.quantity - 1) * item.price };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total_amount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const grandTotal = total_amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Cart is empty!', 'error');
      return;
    }
    if (!payment_amount || parseFloat(payment_amount) < grandTotal) {
      showToast('Insufficient payment amount!', 'error');
      return;
    }

    const newOrder = {
      customer_id: customer_id ? parseInt(customer_id) : (customers[0]?.customer_id || 1),
      staff_id: parseInt(staff_id),
      order_type,
      total_amount: grandTotal,
      orderItems: cart,
      payment: {
        payment_method,
        payment_amount: parseFloat(payment_amount)
      }
    };
    
    const confirmed = await showConfirm(
      'Complete Order',
      `Are you sure you want to complete this order?\n\nGrand Total: RM ${grandTotal.toFixed(2)}\nPayment Method: ${payment_method}\nPayment Amount: RM ${parseFloat(payment_amount).toFixed(2)}`
    );

    if (!confirmed) return;

    try {
      await onPlaceOrder(newOrder);
      const paid = parseFloat(payment_amount);
      const change = paid - grandTotal;
      const txId = `TXN-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

      const resolvedCustomerId = customer_id ? parseInt(customer_id) : (customers[0]?.customer_id || 1);
      const resolvedCustomer = customers.find(c => c.customer_id === resolvedCustomerId);
      const customerName = (resolvedCustomerId === 1 || !resolvedCustomer) ? 'Walk-in Guest' : resolvedCustomer.customer_name;

      const paymentData = {
        status: 'success',
        totalAmount: grandTotal,
        amountPaid: paid,
        balanceDue: change,
        transactionId: txId,
        timestamp: timeStr,
        cashierName: loggedInStaff?.staff_name || 'Active Staff',
        customerName: customerName,
        orderItems: [...cart]
      };

      setPaymentResultState(paymentData);

      // Reset form
      setCart([]);
      setPayment_amount('');
      showToast('Order Completed Successfully!');
    } catch (err) {
      setPaymentResultState({
        status: 'failed',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      });
      showToast('Failed to complete order. Please try again.', 'error');
    }
  };

  const handlePrintReceipt = (receiptData) => {
    const hasData = receiptData && receiptData.orderItems && Array.isArray(receiptData.orderItems);
    const dataToPrint = hasData ? receiptData : paymentResultState;

    if (!dataToPrint) {
      showToast('No receipt data to print.', 'error');
      return;
    }

    printReceipt(dataToPrint);
    showToast('Receipt sent to printer!');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px] h-full min-h-[600px]">
      {/* Left Side: Menu */}
      <div className="flex flex-col h-full bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        {/* Categories Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-3 overflow-x-auto items-center scrollbar-hide">
          <button 
            onClick={() => setSelectedCategoryId('All')}
            className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all border shadow-sm shrink-0 ${selectedCategoryId === 'All' ? 'bg-emerald-600 text-white shadow-emerald-200 border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'}`}
          >
            All Menu
          </button>
          {categories.map(cat => {
            const activeStyle = 'bg-emerald-600 text-white shadow-md shadow-emerald-200/50 border-emerald-600';
            const inactiveStyle = 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700';
            const isActive = selectedCategoryId === cat.category_id;
            
            return (
              <button 
                key={cat.category_id}
                onClick={() => setSelectedCategoryId(cat.category_id)}
                className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all border shadow-sm shrink-0 ${isActive ? activeStyle : inactiveStyle}`}
              >
                {cat.category_name}
              </button>
            );
          })}
        </div>
        
        {/* Menu Items */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedMenuItems.map(item => {
              const inCartCount = cart.find(c => c.menu_item_id === item.menu_item_id)?.quantity || 0;
              const isSelected = inCartCount > 0;
              
              return (
              <button
                key={item.menu_item_id}
                onClick={() => addToCart(item)}
                className={`flex flex-col text-left p-4 rounded-3xl border transition-all duration-300 group relative ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-lg shadow-emerald-200/50 -translate-y-1' 
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-0.5'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shadow-md shadow-emerald-300 z-10 transition-transform scale-in">
                    {inCartCount}
                  </div>
                )}
                <div className={`flex-1 w-full h-40 flex items-center justify-center rounded-2xl mb-4 overflow-hidden relative ${isSelected ? 'bg-emerald-100/50' : 'bg-emerald-50/50'}`}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.menu_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <svg className={`w-12 h-12 stroke-[1.5] transition-transform transform group-hover:scale-110 ${isSelected ? 'text-emerald-500' : 'text-emerald-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m-6.938 13h13.876c.41 0 .742-.336.742-.75A8.25 8.25 0 0 0 3.32 16.25c0 .414.332.75.742.75ZM2 20h20" />
                    </svg>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 truncate w-full">{item.menu_name}</h3>
                <p className="text-emerald-600 font-bold mt-1">RM {item.price.toFixed(2)}</p>
              </button>
            )})}
            {displayedMenuItems.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
                <svg className="w-16 h-16 stroke-[1.2] mb-4 opacity-30 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m-6.938 13h13.876c.41 0 .742-.336.742-.75A8.25 8.25 0 0 0 3.32 16.25c0 .414.332.75.742.75ZM2 20h20" />
                </svg>
                <p>No available items in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Cart & Checkout Form */}
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">Current Order</h2>
          <p className="text-sm text-slate-500 mt-1">Build your cart and checkout</p>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="font-medium">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-5">
              {cart.map(item => (
                <div key={item.menu_item_id} className="flex justify-between items-center group bg-slate-50/50 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{item.menu_name}</h4>
                    <p className="text-sm font-medium text-emerald-600 mt-0.5">RM {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                      <button type="button" onClick={() => decreaseQuantity(item.menu_item_id)} className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition font-bold">-</button>
                      <span className="px-2 font-bold text-slate-900 text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                      <button type="button" onClick={() => addToCart(item)} className="px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 transition font-bold">+</button>
                    </div>
                    <span className="font-bold text-slate-900 min-w-[4rem] text-right">RM {item.subtotal.toFixed(2)}</span>
                    <button 
                      type="button"
                      onClick={() => removeFromCart(item.menu_item_id)}
                      className="text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 p-2 rounded-xl transition-all shadow-sm ml-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Form - Optimized Layout */}
        <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white shrink-0">
          {/* Compact Order Details */}
          <div className="px-6 py-4 space-y-3 border-b border-slate-100">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Order Type</label>
                <select 
                  name="order_type" 
                  value={order_type} 
                  onChange={e => setOrder_type(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                >
                  <option value="Dine-In">Dine-In</option>
                  <option value="Takeaway">Takeaway</option>
                  <option value="Pre-Order">Pre-Order</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Customer</label>
                <select 
                  name="customer_id" 
                  value={customer_id} 
                  onChange={e => setCustomer_id(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                >
                  <option value="">Guest</option>
                  {customers.filter(c => c.customer_id !== 1).map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Method</label>
                <select 
                  name="payment_method" 
                  value={payment_method} 
                  onChange={e => setPayment_method(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                >
                  <option value="Cash">Cash</option>
                  <option value="QR Code">QR Code</option>
                  <option value="Online Transfer">Transfer</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">RM</span>
                <input 
                  type="number" 
                  step="0.01" 
                  name="payment_amount"
                  value={payment_amount}
                  onChange={e => setPayment_amount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition placeholder:font-normal placeholder:text-slate-300"
                  required
                />
              </div>
            </div>
          </div>

          {/* Summary & Button */}
          <div className="px-6 py-3 bg-slate-50/30">
            <div className="flex justify-between items-center mb-3 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-sm">Total Amount</span>
              <span className="text-2xl font-black text-emerald-600">RM {grandTotal.toFixed(2)}</span>
            </div>
            <button 
              type="submit"
              disabled={cart.length === 0}
              className={`w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'hover:shadow-lg'}`}
            >
              <span>Complete Order</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Payment Result Post-Checkout Modal */}
      {paymentResultState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="my-8 w-full max-w-md">
            <div className="relative">
              <PaymentResult
                status={paymentResultState.status}
                totalAmount={paymentResultState.totalAmount}
                amountPaid={paymentResultState.amountPaid}
                balanceDue={paymentResultState.balanceDue}
                transactionId={paymentResultState.transactionId}
                timestamp={paymentResultState.timestamp}
                cashierName={paymentResultState.cashierName}
                customerName={paymentResultState.customerName}
                orderItems={paymentResultState.orderItems}
                onPrint={handlePrintReceipt}
                onTryAgain={() => {
                  setPaymentResultState(null);
                }}
                onClose={() => setPaymentResultState(null)}
              />
              <button 
                type="button" 
                onClick={() => setPaymentResultState(null)}
                className="absolute top-4 right-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-150 hover:scale-110 active:scale-95 z-50"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default POSSystem;

