export const printReceipt = (data) => {
  // Create iframe element
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '80mm';
  iframe.style.height = '600px';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const itemsHtml = data.orderItems.map(item => `
    <tr class="item-row">
      <td class="qty">${item.quantity}x</td>
      <td class="name">${item.menu_name || item.name}</td>
      <td class="price">RM ${(item.price || (item.subtotal / item.quantity)).toFixed(2)}</td>
      <td class="total">RM ${parseFloat(item.subtotal).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${data.transactionId}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.4;
          width: 74mm;
          margin: 0;
          padding: 4mm 4mm 10mm 4mm;
          color: #000;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .header {
          margin-bottom: 10px;
        }
        .logo {
          font-size: 18px;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 4px;
          letter-spacing: 1px;
        }
        .info {
          font-size: 10px;
          margin-bottom: 5px;
          line-height: 1.3;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          font-size: 10px;
          padding: 3px 0;
          vertical-align: top;
        }
        th {
          text-align: left;
          border-bottom: 1px solid #000;
          font-weight: bold;
        }
        .qty {
          width: 12%;
        }
        .name {
          width: 48%;
        }
        .price {
          width: 20%;
          text-align: right;
        }
        .total {
          width: 20%;
          text-align: right;
        }
        .totals-table {
          margin-top: 5px;
        }
        .totals-table td {
          padding: 2px 0;
        }
        .totals-table .label {
          text-align: right;
          padding-right: 10px;
        }
        .totals-table .val {
          text-align: right;
          font-weight: bold;
        }
        .change-row td {
          font-size: 12px;
          font-weight: bold;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 5px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 9px;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>
      <div class="text-center header">
        <div class="logo">AURA ILHAM</div>
        <div class="info">
          Universiti Tun Hussein Onn Malaysia,<br>
          Cafe Kolej Kediaman Tun Dr. Ismail,<br>
          86400 Parit Raja, Batu Pahat, Johor<br>
          Tel: 011-55555555
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div style="font-size: 9px; line-height: 1.3;">
        <strong>Date:</strong> ${data.timestamp}<br>
        <strong>Receipt #:</strong> ${data.transactionId}<br>
        <strong>Cashier:</strong> ${data.cashierName || 'Active Staff'}<br>
        <strong>Customer:</strong> ${data.customerName || 'Walk-in Guest'}
      </div>
      
      <div class="divider"></div>
      
      <table>
        <thead>
          <tr>
            <th class="qty">Qty</th>
            <th class="name">Item</th>
            <th class="price">Price</th>
            <th class="total">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <table class="totals-table">
        <tr>
          <td colspan="3" class="label">Total Amount:</td>
          <td class="val">RM ${parseFloat(data.totalAmount).toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" class="label">Amount Paid:</td>
          <td class="val">RM ${parseFloat(data.amountPaid).toFixed(2)}</td>
        </tr>
        <tr class="change-row">
          <td colspan="3" class="label">Balance / Change Due:</td>
          <td class="val">RM ${parseFloat(data.balanceDue).toFixed(2)}</td>
        </tr>
      </table>
      
      <div class="text-center footer">
        Thank you for dining with us!<br>
        Please come again.
      </div>
      
      <script>
        window.onload = function() {
          window.focus();
          window.print();
          setTimeout(function() {
            window.parent.document.body.removeChild(window.frameElement);
          }, 1500);
        };
      </script>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();
};
