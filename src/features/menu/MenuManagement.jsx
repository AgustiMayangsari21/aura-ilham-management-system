import React, { useState, useRef, useCallback, useEffect } from 'react';

// Utility function to compress and optimize images
const compressImage = (file, callback) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxWidth = 300;
      const maxHeight = 300;
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.85));
    };
  };
};

const MenuManagement = ({ menuItems, categories, onAddMenuItem, onUpdateMenuItem, onToggleAvailability, onDeleteMenuItem, showConfirm, showToast }) => {
  const [menu_name, setMenu_name] = useState('');
  const [price, setPrice] = useState('');
  const [availability_status, setAvailability_status] = useState('Available'); // ENUM: 'Available','Unavailable'
  const [category_id, setCategory_id] = useState(categories[0]?.category_id || 1);
  const [image_url, setImage_url] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!saveStatus) return;
    const timeout = setTimeout(() => setSaveStatus(''), 4000);
    return () => clearTimeout(timeout);
  }, [saveStatus]);

  const isValidImageFile = (file) => {
    return file && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
  };

  const deleteLocalImageFile = async (filePath) => {
    if (!filePath || !filePath.startsWith('/images/menu/')) return;

    try {
      await fetch(`/api/delete-menu-image?filePath=${encodeURIComponent(filePath)}`);
    } catch (error) {
      console.warn('Unable to delete old image file:', error);
    }
  };

  // Callback for handling image upload and saving the file locally on the Vite server
  const handleImageUpload = useCallback(async (file) => {
    if (!file) {
      setImage_url('');
      setIsUploadingImage(false);
      return;
    }

    if (!isValidImageFile(file)) {
      alert('Please upload a JPEG, PNG, WEBP, or GIF image file.');
      setIsUploadingImage(false);
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload-menu-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      setImage_url(data.filePath);
    } catch (error) {
      console.error('Error uploading image:', error);
      const reader = new FileReader();
      reader.onloadend = () => setImage_url(reader.result);
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!menu_name || !price) return;

    if (editingItemId) {
      const confirmed = await showConfirm(
        'Save Changes',
        `Are you sure you want to save changes to the menu item "${menu_name}"?`
      );
      if (!confirmed) return;

      if (originalImageUrl && originalImageUrl !== image_url && originalImageUrl.startsWith('/images/menu/')) {
        await deleteLocalImageFile(originalImageUrl);
      }

      try {
        await onUpdateMenuItem({
          menu_item_id: editingItemId,
          menu_name,
          price: parseFloat(price),
          availability_status,
          category_id: parseInt(category_id),
          image_url
        });
        showToast('Menu item updated successfully');
      } catch (err) {
        showToast('Failed to update menu item.', 'error');
      }
    } else {
      const confirmed = await showConfirm(
        'Add Menu Item',
        `Are you sure you want to add "${menu_name}" to the menu?`
      );
      if (!confirmed) return;

      try {
        await onAddMenuItem({
          menu_name,
          price: parseFloat(price),
          availability_status,
          category_id: parseInt(category_id),
          image_url
        });
        showToast('Menu item added successfully');
      } catch (err) {
        showToast('Failed to add menu item.', 'error');
      }
    }

    handleCancelEdit();
  };

  const handleEditClick = (item) => {
    setEditingItemId(item.menu_item_id);
    setMenu_name(item.menu_name);
    setPrice(item.price.toString());
    setAvailability_status(item.availability_status);
    setCategory_id(item.category_id);
    setImage_url(item.image_url || '');
    setOriginalImageUrl(item.image_url || '');
  };

  const handleDeleteClick = async (menu_item_id) => {
    const confirmed = await showConfirm(
      'Delete Menu Item',
      'Delete this menu item? This cannot be undone.'
    );
    if (confirmed) {
      try {
        await onDeleteMenuItem(menu_item_id);
        if (editingItemId === menu_item_id) handleCancelEdit();
        showToast('Menu item deleted successfully');
      } catch (err) {
        showToast('Failed to delete menu item.', 'error');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setMenu_name('');
    setPrice('');
    setAvailability_status('Available');
    setCategory_id(categories[0]?.category_id || 1);
    setImage_url('');
    setOriginalImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto w-full">


      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Add New Item Form */}
        <div className="w-[380px] bg-white rounded-[28px] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden shrink-0">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-xl font-semibold text-slate-900">{editingItemId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
            <p className="text-sm text-slate-500 mt-1">{editingItemId ? 'Update item details and picture' : 'Create a new item in the system'}</p>
          </div>
        
          <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Menu Name</label>
              <input 
                type="text" 
                name="menu_name"
                value={menu_name}
                onChange={e => setMenu_name(e.target.value)}
                placeholder="e.g. Nasi Lemak"
                className="w-full bg-slate-50/50 border border-slate-200 shadow-sm rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition placeholder:font-normal placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Price (RM)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">RM</span>
                <input 
                  type="number" 
                  step="0.01" 
                  name="price"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50/50 border border-slate-200 shadow-sm rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition placeholder:font-normal placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Menu Picture (Optional)</label>
              <div className="flex items-center gap-4">
                {image_url && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                    <img src={image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="relative w-full">
                  <input 
                    type="file" 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) await handleImageUpload(file);
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition file:cursor-pointer bg-slate-50/50 border border-slate-200 shadow-sm rounded-xl pr-4 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    {isUploadingImage ? 'Uploading image, please wait...' : 'Choose an image before saving the item.'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
              <select 
                name="category_id"
                value={category_id}
                onChange={e => setCategory_id(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 shadow-sm rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Availability</label>
              <select 
                name="availability_status"
                value={availability_status}
                onChange={e => setAvailability_status(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 shadow-sm rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              >
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                type="submit"
                disabled={isUploadingImage}
                className={`w-full text-white font-bold rounded-2xl py-3.5 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 ${isUploadingImage ? 'cursor-not-allowed opacity-70 hover:shadow-none' : ''}`}
              >
                <span>{isUploadingImage ? 'Uploading...' : editingItemId ? 'Update Item' : 'Save Item'}</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </button>
              {editingItemId && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl py-3.5 transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Menu List */}
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden flex-1">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Menu Catalog</h2>
              <p className="text-sm text-slate-500 mt-1">Manage all existing items</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 sticky top-0 z-10 font-bold border-y border-slate-100">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Menu Item</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menuItems.map(item => {
                  const category = categories.find(c => c.category_id === item.category_id)?.category_name || 'Unknown';
                  const isAvailable = item.availability_status === 'Available';
                  
                  return (
                    <tr key={item.menu_item_id} className="hover:bg-slate-50/50 transition group">
                      <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                        {item.image_url ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <img src={item.image_url} alt={item.menu_name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                            <svg className="w-6 h-6 stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m-6.938 13h13.876c.41 0 .742-.336.742-.75A8.25 8.25 0 0 0 3.32 16.25c0 .414.332.75.742.75ZM2 20h20" />
                            </svg>
                          </div>
                        )}
                        {item.menu_name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{category}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">RM {item.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                          isAvailable 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-100/50' 
                            : 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm shadow-rose-100/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {item.availability_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center opacity-0 group-hover:opacity-100 transition">
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-100"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(item.menu_item_id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition"
                          >
                            Delete
                          </button>
                          <button 
                            onClick={async () => {
                              const confirmed = await showConfirm(
                                'Toggle Availability',
                                `Are you sure you want to change the availability of "${item.menu_name}" to ${isAvailable ? 'Unavailable' : 'Available'}?`
                              );
                              if (confirmed) {
                                try {
                                  await onToggleAvailability(item.menu_item_id);
                                  showToast('Availability status updated');
                                } catch (err) {
                                  showToast('Failed to update availability status.', 'error');
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                              isAvailable 
                                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-100' 
                                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100'
                            }`}
                          >
                            Toggle
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {menuItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <svg className="w-12 h-12 stroke-[1.5] text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p className="font-medium">No menu items found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;
