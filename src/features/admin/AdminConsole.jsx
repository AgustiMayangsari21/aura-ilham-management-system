import React, { useState } from 'react';

const AdminConsole = ({
  customers,
  staffList,
  categories,
  orders = [],
  orderItems = [],
  menuItems = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  showConfirm,
  showToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState('staff'); // 'staff', 'customers', 'categories'
  
  // Search & Edit States
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Loyalty Program States & Logic
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSortKey, setCustomerSortKey] = useState('name');

  const getCustomerMetrics = (cId) => {
    const custOrders = (orders || []).filter(o => o.customer_id === cId);
    const spent = custOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const visits = custOrders.length;
    const points = Math.floor(spent);
    
    let tier = 'Bronze';
    if (spent >= 1500) tier = 'Platinum';
    else if (spent >= 500) tier = 'Gold';
    else if (spent >= 100) tier = 'Silver';

    return { spent, visits, points, tier };
  };

  const getTierProgress = (spent) => {
    let nextTierName = 'Silver';
    let nextTierTarget = 100;
    let currentTierMin = 0;
    
    if (spent >= 1500) {
      return { percentage: 100, nextTierName: 'Maxed Out', nextTierTarget: 1500, remaining: 0 };
    } else if (spent >= 500) {
      nextTierName = 'Platinum';
      nextTierTarget = 1500;
      currentTierMin = 500;
    } else if (spent >= 100) {
      nextTierName = 'Gold';
      nextTierTarget = 500;
      currentTierMin = 100;
    }

    const range = nextTierTarget - currentTierMin;
    const progress = spent - currentTierMin;
    const percentage = Math.min(100, Math.max(0, (progress / range) * 100));
    const remaining = nextTierTarget - spent;

    return { percentage, nextTierName, nextTierTarget, remaining };
  };

  const getSelectedCustomerDetails = () => {
    if (!selectedCustomerId) return null;
    const c = customers.find(cust => cust.customer_id === selectedCustomerId);
    if (!c) return null;

    const metrics = getCustomerMetrics(selectedCustomerId);
    const progressInfo = getTierProgress(metrics.spent);
    const custOrders = (orders || []).filter(o => o.customer_id === selectedCustomerId).sort((a,b) => b.order_id - a.order_id);

    // Find favorite dish
    const custOrderIds = custOrders.map(o => o.order_id);
    const itemsOrdered = (orderItems || []).filter(oi => custOrderIds.includes(oi.order_id));
    const itemCounts = {};
    itemsOrdered.forEach(item => {
      itemCounts[item.menu_item_id] = (itemCounts[item.menu_item_id] || 0) + item.quantity;
    });
    let favoriteItemId = null;
    let maxCount = 0;
    Object.entries(itemCounts).forEach(([itemId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteItemId = parseInt(itemId);
      }
    });
    const favoriteItem = (menuItems || []).find(m => m.menu_item_id === favoriteItemId);

    return {
      ...c,
      ...metrics,
      ...progressInfo,
      favoriteDish: favoriteItem ? favoriteItem.menu_name : null,
      history: custOrders
    };
  };

  const selectedCustomerDetails = getSelectedCustomerDetails();

  // Form Fields - Staff
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Waiter');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Form Fields - Customer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Form Fields - Category
  const [categoryName, setCategoryName] = useState('');

  const resetForms = () => {
    setEditingId(null);
    setStaffName('');
    setStaffRole('Waiter');
    setStaffPhone('');
    setStaffUsername('');
    setStaffPassword('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCategoryName('');
  };

  const handleEditClick = (type, item) => {
    setEditingId(item[`${type}_id`]);
    if (type === 'staff') {
      setStaffName(item.staff_name);
      setStaffRole(item.role);
      setStaffPhone(item.phone_number);
      setStaffUsername(item.username);
      setStaffPassword(''); // keep empty to signal no password change
    } else if (type === 'customer') {
      setCustomerName(item.customer_name);
      setCustomerPhone(item.phone_number);
      setCustomerEmail(item.email || '');
    } else if (type === 'category') {
      setCategoryName(item.category_name);
    }
  };

  // Submission Handlers
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!staffName || !staffUsername || (!editingId && !staffPassword)) return;

    const payload = {
      staff_name: staffName,
      role: staffRole,
      phone_number: staffPhone,
      username: staffUsername,
    };
    if (staffPassword) payload.password = staffPassword;

    if (editingId) {
      const confirmed = await showConfirm('Update Employee', `Are you sure you want to update account for "${staffName}"?`);
      if (!confirmed) return;

      try {
        await onUpdateStaff({ ...payload, staff_id: editingId });
        showToast('Employee account updated successfully');
        resetForms();
      } catch (err) {
        showToast(err.message || 'Failed to update employee.', 'error');
      }
    } else {
      const confirmed = await showConfirm('Add Employee', `Are you sure you want to create a new employee profile for "${staffName}"?`);
      if (!confirmed) return;

      try {
        await onAddStaff(payload);
        showToast('New employee account created successfully');
        resetForms();
      } catch (err) {
        showToast(err.message || 'Failed to add employee.', 'error');
      }
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    const payload = {
      customer_name: customerName,
      phone_number: customerPhone,
      email: customerEmail || null
    };

    if (editingId) {
      const confirmed = await showConfirm('Update Customer', `Are you sure you want to save changes to customer "${customerName}"?`);
      if (!confirmed) return;

      try {
        await onUpdateCustomer({ ...payload, customer_id: editingId });
        showToast('Customer profile updated');
        resetForms();
      } catch (err) {
        showToast('Failed to update customer profile.', 'error');
      }
    } else {
      const confirmed = await showConfirm('Add Customer', `Add new customer "${customerName}" to the directory?`);
      if (!confirmed) return;

      try {
        await onAddCustomer(payload);
        showToast('Customer profile added');
        resetForms();
      } catch (err) {
        showToast('Failed to save customer.', 'error');
      }
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) return;

    if (editingId) {
      const confirmed = await showConfirm('Rename Category', `Rename this category to "${categoryName}"?`);
      if (!confirmed) return;

      try {
        await onUpdateCategory({ category_name: categoryName, category_id: editingId });
        showToast('Category renamed successfully');
        resetForms();
      } catch (err) {
        showToast('Failed to rename category.', 'error');
      }
    } else {
      const confirmed = await showConfirm('Create Category', `Create a new category named "${categoryName}"?`);
      if (!confirmed) return;

      try {
        await onAddCategory({ category_name: categoryName });
        showToast('New category created');
        resetForms();
      } catch (err) {
        showToast('Failed to save category.', 'error');
      }
    }
  };

  // Delete Handlers
  const handleDeleteClick = async (type, id, name) => {
    const confirmed = await showConfirm(
      `Delete ${type === 'staff' ? 'Employee' : type === 'customer' ? 'Customer' : 'Category'}`,
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      if (type === 'staff') {
        await onDeleteStaff(id);
      } else if (type === 'customer') {
        await onDeleteCustomer(id);
      } else if (type === 'category') {
        await onDeleteCategory(id);
      }
      showToast(`${name} deleted successfully`);
      if (editingId === id) resetForms();
    } catch (err) {
      showToast(err.message || `Failed to delete ${name}.`, 'error');
    }
  };

  // Filter lists based on search
  const filteredCustomers = customers.filter(c => 
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone_number.includes(searchQuery)
  );

  const filteredStaff = staffList.filter(s => 
    s.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(c => 
    c.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Sub Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => { setActiveSubTab('staff'); setSearchQuery(''); resetForms(); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeSubTab === 'staff' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Employee Accounts ({staffList.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('customers'); setSearchQuery(''); resetForms(); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeSubTab === 'customers' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Directory ({customers.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('categories'); setSearchQuery(''); resetForms(); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeSubTab === 'categories' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Menu Categories ({categories.length})
          </button>
        </div>

        {/* Global Search box */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeSubTab}...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/25 outline-none transition"
          />
        </div>
      </div>

      {/* Main Form & Directory Split View */}
      <div className="flex flex-col lg:flex-row gap-6 overflow-hidden flex-1">
        
        {/* Form Panel */}
        <div className="lg:w-[380px] bg-white rounded-[28px] border border-slate-200 shadow-sm flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-200 bg-slate-50/80 rounded-t-[28px]">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Edit Profile' : 'Add New Record'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Create or edit entries in the system database.
            </p>
          </div>

          {/* Form wrapper */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeSubTab === 'staff' && (
              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employee Name</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    placeholder="e.g. Ahmad Farid"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Role / Position</label>
                  <select
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Waiter">Waiter</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={e => setStaffPhone(e.target.value)}
                    placeholder="e.g. 012-3456789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username (ID)</label>
                  <input
                    type="text"
                    value={staffUsername}
                    onChange={e => setStaffUsername(e.target.value)}
                    placeholder="e.g. farid_01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {editingId ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={e => setStaffPassword(e.target.value)}
                    placeholder={editingId ? 'Leave blank to keep unchanged' : '••••••••'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    required={!editingId}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm">
                    {editingId ? 'Save Changes' : 'Create Account'}
                  </button>
                  <button type="button" onClick={resetForms} className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl py-2.5 text-xs font-bold transition">
                    Clear Form
                  </button>
                </div>
              </form>
            )}

            {activeSubTab === 'customers' && (
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Siti Nurhaliza"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 017-6666666"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email (Optional)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm">
                    {editingId ? 'Save Changes' : 'Add Profile'}
                  </button>
                  <button type="button" onClick={resetForms} className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl py-2.5 text-xs font-bold transition">
                    Clear Form
                  </button>
                </div>
              </form>
            )}

            {activeSubTab === 'categories' && (
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category Name</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    placeholder="e.g. Side Dishes"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm">
                    {editingId ? 'Rename' : 'Create Category'}
                  </button>
                  <button type="button" onClick={resetForms} className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl py-2.5 text-xs font-bold transition">
                    Clear Form
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Directory Panel */}
        <div className="flex-1 bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">
              {activeSubTab === 'staff' && 'Employee Account Directory'}
              {activeSubTab === 'customers' && 'Customer CRM Profiles'}
              {activeSubTab === 'categories' && 'Menu Categories'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Browse list and manage current database values.
            </p>
          </div>

          <div className="flex-1 overflow-auto">
            {activeSubTab === 'staff' && (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-6 py-3 font-bold">Staff ID</th>
                    <th className="px-6 py-3 font-bold">Name</th>
                    <th className="px-6 py-3 font-bold">Username ID</th>
                    <th className="px-6 py-3 font-bold">Role</th>
                    <th className="px-6 py-3 font-bold">Phone Number</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map(s => (
                    <tr key={s.staff_id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-400">#{s.staff_id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{s.staff_name}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">{s.username}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border ${
                          s.role === 'Admin' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                          s.role === 'Manager' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                          s.role === 'Waiter' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                          'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          {s.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{s.phone_number}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEditClick('staff', s)} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteClick('staff', s.staff_id, s.staff_name)} className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 transition">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeSubTab === 'customers' && (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-6 py-3 font-bold">Cust ID</th>
                    <th 
                      onClick={() => setCustomerSortKey('name')}
                      className="px-6 py-3 font-bold cursor-pointer hover:text-emerald-700 transition select-none"
                      title="Sort by Name alphabetical"
                    >
                      Name {customerSortKey === 'name' ? '↓' : ''}
                    </th>
                    <th className="px-6 py-3 font-bold">Phone Number</th>
                    <th 
                      onClick={() => setCustomerSortKey('spent')}
                      className="px-6 py-3 font-bold cursor-pointer hover:text-emerald-700 transition select-none"
                      title="Sort by Lifetime Spent"
                    >
                      Total Spent {customerSortKey === 'spent' ? '↓' : ''}
                    </th>
                    <th 
                      onClick={() => setCustomerSortKey('points')}
                      className="px-6 py-3 font-bold cursor-pointer hover:text-emerald-700 transition select-none"
                      title="Sort by Loyalty Points"
                    >
                      Loyalty Points {customerSortKey === 'points' ? '↓' : ''}
                    </th>
                    <th className="px-6 py-3 font-bold">Tier</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...filteredCustomers].sort((a, b) => {
                    const metricsA = getCustomerMetrics(a.customer_id);
                    const metricsB = getCustomerMetrics(b.customer_id);
                    if (customerSortKey === 'spent') {
                      return metricsB.spent - metricsA.spent;
                    } else if (customerSortKey === 'points') {
                      return metricsB.points - metricsA.points;
                    } else {
                      return a.customer_name.localeCompare(b.customer_name);
                    }
                  }).map(c => {
                    const metrics = getCustomerMetrics(c.customer_id);
                    return (
                      <tr 
                        key={c.customer_id} 
                        onClick={(e) => {
                          // Only open details if not clicking an action button
                          if (e.target.tagName !== 'BUTTON') {
                            setSelectedCustomerId(c.customer_id);
                          }
                        }}
                        className="hover:bg-slate-50 transition cursor-pointer"
                        title="Click to view loyalty & history details"
                      >
                        <td className="px-6 py-4 font-bold text-slate-400">#{c.customer_id}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 ${
                            c.customer_id === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                            metrics.tier === 'Platinum' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-100' :
                            metrics.tier === 'Gold' ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-sm shadow-amber-100' :
                            metrics.tier === 'Silver' ? 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm shadow-teal-100' :
                            'bg-gradient-to-br from-orange-400 to-amber-500 shadow-sm shadow-orange-100'
                          }`}>
                            {c.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-bold flex items-center gap-1.5">
                              {c.customer_name}
                              {c.customer_id !== 1 && (
                                <svg className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </span>
                            {c.customer_id !== 1 && c.email && (
                              <span className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">{c.email}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{c.phone_number}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {c.customer_id === 1 ? '-' : `RM ${metrics.spent.toFixed(2)}`}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-emerald-600">
                          {c.customer_id === 1 ? '-' : (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 shrink-0" viewBox="0 0 24 24">
                                <path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z" />
                              </svg>
                              <span>{metrics.points} pts</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {c.customer_id === 1 ? (
                            <span className="text-[10px] text-slate-400 italic font-semibold">N/A</span>
                          ) : (
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              metrics.tier === 'Platinum' ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm shadow-indigo-50/50' :
                              metrics.tier === 'Gold' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-50/50' :
                              metrics.tier === 'Silver' ? 'bg-teal-50 border-teal-100 text-teal-700 shadow-sm shadow-teal-50/50' :
                              'bg-orange-50 border-orange-100 text-orange-600'
                            }`}>
                              {metrics.tier}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {c.customer_id !== 1 ? (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); handleEditClick('customer', c); }} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition">
                                Edit
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('customer', c.customer_id, c.customer_name); }} className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 transition">
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic pr-4">System Default</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeSubTab === 'categories' && (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-6 py-3 font-bold">Category ID</th>
                    <th className="px-6 py-3 font-bold">Category Name</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map(c => (
                    <tr key={c.category_id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-400">#{c.category_id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{c.category_name}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEditClick('category', c)} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition">
                          Rename
                        </button>
                        <button onClick={() => handleDeleteClick('category', c.category_id, c.category_name)} className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 transition">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Customer Loyalty & CRM Profile Modal */}
      {selectedCustomerDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 animate-scale-in max-h-[85vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg ${
                  selectedCustomerDetails.tier === 'Platinum' ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600' :
                  selectedCustomerDetails.tier === 'Gold' ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600' :
                  selectedCustomerDetails.tier === 'Silver' ? 'bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-600' :
                  'bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600'
                } shadow-md`}>
                  {selectedCustomerDetails.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCustomerDetails.customer_name}</h3>
                  <p className="text-[11px] font-semibold text-slate-500">{selectedCustomerDetails.phone_number} • {selectedCustomerDetails.email || 'No Email'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomerId(null)} 
                className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Loyalty Metrics */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center shrink-0">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tier Level</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                  selectedCustomerDetails.tier === 'Platinum' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm shadow-indigo-50/50' :
                  selectedCustomerDetails.tier === 'Gold' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-50/50' :
                  selectedCustomerDetails.tier === 'Silver' ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm shadow-teal-50/50' :
                  'bg-orange-50 border-orange-200 text-orange-700 shadow-sm shadow-orange-50/50'
                }`}>
                  {selectedCustomerDetails.tier}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Points Balance</p>
                <p className="text-sm font-black text-emerald-600">{selectedCustomerDetails.points} PTS</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Spent</p>
                <p className="text-sm font-black text-slate-900">RM {selectedCustomerDetails.spent.toFixed(2)}</p>
              </div>
            </div>

            {/* Tier Progress (Ratio Color Progress Bar) */}
            {selectedCustomerDetails.customer_id !== 1 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span>Tier Progress</span>
                  {selectedCustomerDetails.spent >= 1500 ? (
                    <span className="text-indigo-600 font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      PLATINUM MAX LEVEL
                    </span>
                  ) : (
                    <span>
                      RM {selectedCustomerDetails.remaining.toFixed(2)} TO <span className="text-emerald-600 font-extrabold">{selectedCustomerDetails.nextTierName}</span>
                    </span>
                  )}
                </div>
                
                {/* Visual Ratio Bar with Gradient */}
                <div className="h-3.5 w-full bg-slate-200/80 rounded-full overflow-hidden relative shadow-inner p-[2px]">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(20,184,166,0.4)]" 
                    style={{ width: `${selectedCustomerDetails.percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1.5">
                  <span>{selectedCustomerDetails.tier} (Current)</span>
                  <span>{selectedCustomerDetails.spent >= 1500 ? 'Maxed' : `${selectedCustomerDetails.nextTierName} (RM ${selectedCustomerDetails.nextTierTarget})`}</span>
                </div>
              </div>
            )}

            {/* Loyalty Perks info */}
            <div className="bg-emerald-50/50 border border-emerald-100/80 p-3 rounded-xl text-emerald-800 text-[10px] font-medium shrink-0 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>
                {selectedCustomerDetails.tier === 'Platinum' && '15% Platinum discount applies automatically to bookings.'}
                {selectedCustomerDetails.tier === 'Gold' && '10% Gold discount applies automatically to bookings.'}
                {selectedCustomerDetails.tier === 'Silver' && '5% Silver discount applies automatically to bookings.'}
                {selectedCustomerDetails.tier === 'Bronze' && 'Earn points to unlock Silver Tier at RM 100.'}
              </span>
            </div>

            {/* Sub-stats (Favorite Dish & Visits) */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Visits (Orders)</p>
                <p className="text-xs font-bold text-slate-800">{selectedCustomerDetails.visits} Transactions</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center overflow-hidden">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Favorite Dish</p>
                <p className="text-xs font-bold text-emerald-700 truncate">{selectedCustomerDetails.favoriteDish || 'None Ordered'}</p>
              </div>
            </div>

            {/* Transaction History */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 shrink-0">Recent Order History</p>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {selectedCustomerDetails.history.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8 italic bg-slate-50 rounded-xl">No transactions found for this customer.</p>
                ) : (
                  selectedCustomerDetails.history.map(order => (
                    <div key={order.order_id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100/50 transition">
                      <div>
                        <p className="font-bold text-slate-950">Order #{order.order_id.toString().padStart(4, '0')}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{new Date(order.order_date).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">RM {parseFloat(order.total_amount).toFixed(2)}</p>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          order.order_status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          order.order_status === 'Pending' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {order.order_status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition text-center"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
