import React, { useState, useEffect, useRef, useCallback } from 'react';

const Inventory = ({ inventory, onAddInventory, onUpdateInventory, onDeleteInventory, showConfirm, showToast }) => {
  const [inventory_name, setInventory_name] = useState('');
  const [category, setCategory] = useState('General');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [min_threshold, setMin_threshold] = useState('');
  const [image_url, setImage_url] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!editingItemId) {
      setInventory_name('');
      setCategory('General');
      setQuantity('');
      setUnit('kg');
      setMin_threshold('');
      setImage_url('');
      setOriginalImageUrl('');
    }
  }, [editingItemId]);

  const resetForm = () => {
    setEditingItemId(null);
    setInventory_name('');
    setCategory('General');
    setQuantity('');
    setUnit('kg');
    setMin_threshold('');
    setImage_url('');
    setOriginalImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isValidImageFile = (file) => {
    return file && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
  };

  const uploadInventoryImage = useCallback(async (file) => {
    if (!file) return;
    if (!isValidImageFile(file)) {
      alert('Please upload a JPEG, PNG, WEBP, or GIF image.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload-menu-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setImage_url(data.filePath);
      return data.filePath;
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Unable to upload image. Please try again.');
    }
  }, []);

  const buildStockStatus = (qty, minValue) => {
    if (qty <= 0) return 'Out of Stock';
    if (qty <= minValue) return 'Low Stock';
    return 'In Stock';
  };

  const getStockBadgeClasses = (status) => {
    switch (status) {
      case 'Out of Stock': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Low Stock': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inventory_name || !category || !quantity || !unit || !min_threshold) return;

    const qty = parseFloat(quantity);
    const minValue = parseFloat(min_threshold);
    const stock_status = buildStockStatus(qty, minValue);

    const inventoryPayload = {
      inventory_name,
      category,
      quantity: qty,
      unit,
      min_threshold: minValue,
      stock_status,
      image_url
    };

    if (editingItemId) {
      const confirmed = await showConfirm(
        'Save Changes',
        `Are you sure you want to save changes to the ingredient "${inventory_name}"?`
      );
      if (!confirmed) return;

      try {
        await onUpdateInventory({ ...inventoryPayload, inventory_id: editingItemId });
        resetForm();
        showToast('Ingredient updated successfully');
      } catch (err) {
        showToast('Failed to update ingredient.', 'error');
      }
      return;
    }

    const confirmed = await showConfirm(
      'Add Ingredient',
      `Are you sure you want to add "${inventory_name}" to the inventory?`
    );
    if (!confirmed) return;

    try {
      await onAddInventory(inventoryPayload);
      resetForm();
      showToast('Ingredient added successfully');
    } catch (err) {
      showToast('Failed to add ingredient.', 'error');
    }
  };

  const handleEditClick = (item) => {
    setEditingItemId(item.inventory_id);
    setInventory_name(item.inventory_name);
    setCategory(item.category || 'General');
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setMin_threshold(item.min_threshold.toString());
    setImage_url(item.image_url || '');
    setOriginalImageUrl(item.image_url || '');
  };

  const handleDeleteClick = async (inventory_id) => {
    const confirmed = await showConfirm(
      'Delete Ingredient',
      'Delete this ingredient? This cannot be undone.'
    );
    if (confirmed) {
      try {
        await onDeleteInventory(inventory_id);
        showToast('Ingredient deleted successfully');
      } catch (err) {
        showToast('Failed to delete ingredient.', 'error');
      }
    }
  };

  const outOfStockCount = inventory.filter(item => parseFloat(item.quantity) <= 0).length;
  const lowStockCount = inventory.filter(item => parseFloat(item.quantity) > 0 && parseFloat(item.quantity) <= parseFloat(item.min_threshold)).length;
  const healthyCount = inventory.filter(item => parseFloat(item.quantity) > parseFloat(item.min_threshold)).length;

  return (
    <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row gap-6 overflow-hidden">
        <div className="lg:w-[360px] bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/80">
            <h2 className="text-xl font-semibold text-slate-900">{editingItemId ? 'Edit Ingredient' : 'Add Ingredient'}</h2>
            <p className="text-sm text-slate-500 mt-1">Manage ingredient stock, category, and minimum threshold.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ingredient Name</label>
              <input
                type="text"
                value={inventory_name}
                onChange={e => setInventory_name(e.target.value)}
                placeholder="e.g. Rice"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Pantry"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                required
              />
            </div>

            <div className="col-span-full">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ingredient Image (optional)</label>
              <div className="flex items-center gap-4">
                {image_url ? (
                  <div className="w-16 h-16 rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={image_url} alt="Ingredient" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">+</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) await uploadInventoryImage(file);
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition bg-slate-50/50 border border-slate-200 rounded-2xl pr-4 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Current Stock</label>
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="kg, g, pcs"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Minimum Threshold</label>
              <input
                type="number"
                step="0.01"
                value={min_threshold}
                onChange={e => setMin_threshold(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3 font-semibold transition shadow-sm"
              >
                {editingItemId ? 'Save Changes' : 'Add Ingredient'}
              </button>
              {editingItemId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl py-3 font-semibold transition border border-slate-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="flex-1 min-w-0 bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Ingredients Inventory</h2>
              <p className="text-sm text-slate-500 mt-1">Track stock levels, categories, and low-stock warnings.</p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
              <span className="font-semibold">Low stock:</span>
              <span className="text-rose-600">{lowStockCount}</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold">Out of stock:</span>
              <span className="text-slate-700">{outOfStockCount}</span>
            </div>
          </div>

          <div className="max-h-[680px] overflow-y-auto">
            <table className="min-w-full w-full table-fixed text-sm text-left border-separate border-spacing-y-2">
              <thead className="bg-slate-50 sticky top-0 z-20 text-slate-500 uppercase text-xs tracking-[0.15em]">
                <tr>
                  <th className="px-4 py-3 w-[90px]">Image</th>
                  <th className="px-4 py-3 w-[180px]">Ingredient</th>
                  <th className="px-4 py-3 w-[140px]">Category</th>
                  <th className="px-4 py-3 w-[140px]">Current Stock</th>
                  <th className="px-4 py-3 w-[120px]">Minimum</th>
                  <th className="px-4 py-3 w-[120px]">Status</th>
                  <th className="px-4 py-3 text-right w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map(item => {
                  const qty = parseFloat(item.quantity);
                  const min = parseFloat(item.min_threshold);
                  const isLow = qty <= min;
                  const progressPercent = qty && min ? Math.min((qty / Math.max(min * 2, qty)) * 100, 100) : 0;

                  return (
                    <tr key={item.inventory_id} className={`${isLow ? 'bg-rose-50/60 border-l-4 border-rose-500' : 'hover:bg-slate-50'} transition`}> 
                      <td className="px-6 py-4">
                        <div className="w-14 h-14 rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.inventory_name} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.inventory_name}</td>
                      <td className="px-6 py-4 text-slate-500">{item.category || 'General'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <span className="font-semibold text-slate-800">{qty.toFixed(2)} {item.unit}</span>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{min.toFixed(2)} {item.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${getStockBadgeClasses(buildStockStatus(qty, min))}`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={qty <= 0 ? 'M12 8v4m0 4h.01M5.07 19h13.86a2 2 0 001.8-2.8l-6.93-12.1a2 2 0 00-3.46 0L3.27 16.2A2 2 0 005.07 19z' : isLow ? 'M12 8v4m0 4h.01M5.07 19h13.86a2 2 0 001.8-2.8l-6.93-12.1a2 2 0 00-3.46 0L3.27 16.2A2 2 0 005.07 19z' : 'M5 13l4 4L19 7'} /></svg>
                          {buildStockStatus(qty, min)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" /></svg>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(item.inventory_id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
