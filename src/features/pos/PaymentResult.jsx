import React from 'react';

const PaymentResult = ({
  status = 'success', // 'success' | 'failed'
  totalAmount = 45.90,
  amountPaid = 50.00,
  balanceDue = 4.10,
  transactionId = 'TXN-2026-0522-8749',
  timestamp = '2026-05-22 12:02:32 UTC',
  cashierName,
  customerName,
  orderItems = [
    { menu_name: 'Nasi Lemak Special', quantity: 2, subtotal: 24.00 },
    { menu_name: 'Teh Tarik Kaw', quantity: 3, subtotal: 10.50 },
    { menu_name: 'Roti Canai Tsunami', quantity: 1, subtotal: 11.40 }
  ],
  onClose,
  onPrint,
  onTryAgain
}) => {

  const formatCurrency = (amount) => {
    return `RM ${parseFloat(amount || 0).toFixed(2)}`;
  };

  // 1. FAILED STATE CARD
  const FailedCard = () => (
    <div className="w-full max-w-md bg-white rounded-[32px] border-2 border-red-100 shadow-xl shadow-red-50/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] flex flex-col relative">
      {/* Red accent header bar */}
      <div className="h-2 bg-red-500 w-full"></div>
      
      <div className="p-8 flex-1 flex flex-col items-center text-center">
        {/* Error icon circle */}
        <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-inner animate-pulse-subtle">
          <svg className="w-10 h-10 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Failed Message */}
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Transaction Failed</h3>
        <p className="text-red-700 font-bold text-sm bg-red-50 px-4 py-3 rounded-2xl border border-red-200/80 leading-relaxed mb-6 w-full text-center">
          Failed to complete order. Please try again.
        </p>

        {/* Sub-text details */}
        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400 font-semibold">Error Code:</span>
            <span className="text-slate-600 font-bold">ERR_PAY_TIMEOUT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-semibold">Connection:</span>
            <span className="text-slate-600 font-bold">Gateway Timeout</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-semibold">Secure Timestamp:</span>
            <span className="text-slate-600 font-mono font-bold">{timestamp}</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="w-full space-y-3 mt-auto">
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onTryAgain || onClose}
            className="no-print w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-red-200/50 hover:shadow-lg hover:shadow-red-200 transition duration-150 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Try Again</span>
          </button>
          
          {/* Secondary Action Button */}
          <button
            type="button"
            onClick={onClose}
            className="no-print w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition duration-150"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );

  // 2. SUCCESS STATE CARD (RECEIPT STYLE)
  const SuccessCard = () => (
    <div className="printable-receipt w-full max-w-md bg-white rounded-[32px] border-2 border-emerald-100 shadow-xl shadow-emerald-50/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] flex flex-col relative">
      {/* Green accent header bar */}
      <div className="h-2 bg-emerald-500 w-full"></div>

      <div className="p-8 flex-1 flex flex-col">
        {/* Success Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
            <svg className="w-8 h-8 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Order Successful!</h3>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Aura Ilham</p>
          <p className="text-[9px] text-slate-400 font-semibold leading-tight text-center max-w-xs mt-1">
            Universiti Tun Hussein Onn Malaysia,<br />
            Cafe Kolej Kediaman Tun Dr. Ismail,<br />
            86400 Parit Raja, Batu Pahat, Johor
          </p>
        </div>

        {/* Database Audit trail section */}
        <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-2.5 text-xs mb-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Transaction ID</span>
            <span className="text-slate-800 font-mono font-bold tracking-tight bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{transactionId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Secure Timestamp</span>
            <span className="text-slate-700 font-mono font-semibold">{timestamp}</span>
          </div>
          {cashierName && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Cashier</span>
              <span className="text-slate-700 font-semibold">{cashierName}</span>
            </div>
          )}
          {customerName && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Customer</span>
              <span className="text-slate-700 font-semibold">{customerName}</span>
            </div>
          )}
        </div>

        {/* Receipt Break line (Perforated Edge) */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            {/* Dashed line to mimic physical receipt edge */}
            <div className="w-full border-t border-dashed border-slate-300"></div>
          </div>
          <div className="relative px-3 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest bg-white z-10">
            RECEIPT BREAKDOWN
          </div>
          {/* Half-circles on left and right borders to represent a ticket coupon */}
          <div className="absolute -left-11 w-6 h-6 rounded-full bg-slate-100 border-r-2 border-emerald-100"></div>
          <div className="absolute -right-11 w-6 h-6 rounded-full bg-slate-100 border-l-2 border-emerald-100"></div>
        </div>

        {/* Receipt Content */}
        <div className="space-y-4 py-4 flex-1">
          {/* Itemized List */}
          <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
            {orderItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs font-medium text-slate-700">
                <div className="flex gap-2">
                  <span className="font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] h-fit">{item.quantity}x</span>
                  <span className="text-slate-900">{item.menu_name}</span>
                </div>
                <span className="font-bold text-slate-800">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-4 space-y-2.5">
            {/* Financial Breakdown */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-semibold">Total Amount</span>
              <span className="text-slate-900 font-bold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-semibold">Amount Paid</span>
              <span className="text-slate-900 font-bold">{formatCurrency(amountPaid)}</span>
            </div>
            
            {/* Balance / Change Due (Highlighted in Green banner) */}
            <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 mt-2">
              <span className="text-emerald-800 font-bold text-xs uppercase tracking-wider">Balance / Change Due</span>
              <span className="text-xl font-black text-emerald-700">{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onPrint) {
              onPrint({
                totalAmount,
                amountPaid,
                balanceDue,
                transactionId,
                timestamp,
                cashierName,
                customerName,
                orderItems
              });
            }
          }}
          className="no-print w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-emerald-200/50 hover:shadow-lg hover:shadow-emerald-200 transition duration-150 flex items-center justify-center gap-2 mb-2.5"
        >
          {/* Printer SVG Icon */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print Receipt</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="no-print w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition duration-150"
        >
          Complete & Exit
        </button>
      </div>
    </div>
  );

  if (status === 'failed') {
    return <FailedCard />;
  }

  return <SuccessCard />;
};

export default PaymentResult;
