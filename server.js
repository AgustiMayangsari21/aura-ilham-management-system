import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '4000', 10);

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aura_ilham_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
};

const pool = mysql.createPool(dbConfig);

const publicDir = path.resolve(process.cwd(), 'public');
const uploadDir = path.resolve(publicDir, 'images/menu');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());
app.use('/images', express.static(path.resolve(publicDir, 'images')));

const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const runMigrations = async () => {
  await query(`ALTER TABLE Menu_Item ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) NULL`);
  await query(`ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) NULL`);
  await query(`ALTER TABLE Inventory ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL DEFAULT 'General'`);
};


app.get('/api/bootstrap', async (req, res) => {
  try {
    const [categories, customers, staffList, inventory, menuItems, orders, orderItems, payments] = await Promise.all([
      query('SELECT * FROM Category ORDER BY category_id'),
      query('SELECT * FROM Customer ORDER BY customer_id'),
      query('SELECT staff_id, staff_name, role, phone_number, username FROM Staff ORDER BY staff_id'),
      query('SELECT * FROM Inventory ORDER BY inventory_id'),
      query('SELECT * FROM Menu_Item ORDER BY menu_item_id'),
      query('SELECT * FROM `Order` ORDER BY order_id'),
      query('SELECT * FROM Order_Item ORDER BY order_item_id'),
      query('SELECT * FROM Payment ORDER BY payment_id'),
    ]);

    res.json({ categories, customers, staffList, inventory, menuItems, orders, orderItems, payments });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM Category ORDER BY category_id');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/menu-items', async (req, res) => {
  try {
    const menuItems = await query('SELECT * FROM Menu_Item ORDER BY menu_item_id');
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu-items', async (req, res) => {
  try {
    const { menu_name, price, availability_status, category_id, image_url } = req.body;
    const result = await query(
      'INSERT INTO Menu_Item (menu_name, price, availability_status, category_id, image_url) VALUES (?, ?, ?, ?, ?)',
      [menu_name, price, availability_status, category_id, image_url || null]
    );
    const [rows] = await pool.execute('SELECT * FROM Menu_Item WHERE menu_item_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { menu_name, price, availability_status, category_id, image_url } = req.body;
    await query(
      'UPDATE Menu_Item SET menu_name = ?, price = ?, availability_status = ?, category_id = ?, image_url = ? WHERE menu_item_id = ?',
      [menu_name, price, availability_status, category_id, image_url || null, id]
    );
    const [rows] = await pool.execute('SELECT * FROM Menu_Item WHERE menu_item_id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/menu-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Menu_Item WHERE menu_item_id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const inventory = await query('SELECT * FROM Inventory ORDER BY inventory_id');
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { inventory_name, category, quantity, unit, min_threshold, stock_status, image_url } = req.body;
    const dbStockStatus = (stock_status === 'Low Stock' || stock_status === 'Out of Stock') ? 'Low Stock' : 'Sufficient';
    const result = await query(
      'INSERT INTO Inventory (inventory_name, category, quantity, unit, min_threshold, stock_status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [inventory_name, category || 'General', quantity, unit, min_threshold, dbStockStatus, image_url || null]
    );
    const [rows] = await pool.execute('SELECT * FROM Inventory WHERE inventory_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { inventory_name, category, quantity, unit, min_threshold, stock_status, image_url } = req.body;
    const dbStockStatus = (stock_status === 'Low Stock' || stock_status === 'Out of Stock') ? 'Low Stock' : 'Sufficient';
    await query(
      'UPDATE Inventory SET inventory_name = ?, category = ?, quantity = ?, unit = ?, min_threshold = ?, stock_status = ?, image_url = ? WHERE inventory_id = ?',
      [inventory_name, category || 'General', quantity, unit, min_threshold, dbStockStatus, image_url || null, id]
    );
    const [rows] = await pool.execute('SELECT * FROM Inventory WHERE inventory_id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Inventory WHERE inventory_id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await query('SELECT * FROM Customer ORDER BY customer_id');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/staff', async (req, res) => {
  try {
    const staffList = await query('SELECT staff_id, staff_name, role, phone_number, username FROM Staff ORDER BY staff_id');
    res.json(staffList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await query('SELECT * FROM `Order` ORDER BY order_id');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/order-items', async (req, res) => {
  try {
    const orderItems = await query('SELECT * FROM Order_Item ORDER BY order_item_id');
    res.json(orderItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const payments = await query('SELECT * FROM Payment ORDER BY payment_id');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_id, staff_id, order_type, total_amount, orderItems, payment } = req.body;
    const [orderResult] = await connection.execute(
      'INSERT INTO `Order` (customer_id, staff_id, order_type, order_status, total_amount) VALUES (?, ?, ?, ?, ?)',
      [customer_id, staff_id, order_type, 'Pending', total_amount]
    );

    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.execute(
        'INSERT INTO Order_Item (order_id, menu_item_id, quantity, subtotal) VALUES (?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.subtotal]
      );
    }

    await connection.execute(
      'INSERT INTO Payment (order_id, payment_method, payment_amount) VALUES (?, ?, ?)',
      [orderId, payment.payment_method, payment.payment_amount]
    );

    await connection.commit();
    res.status(201).json({ success: true, order_id: orderId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;
    await query('UPDATE `Order` SET order_status = ? WHERE order_id = ?', [order_status, id]);
    const [rows] = await pool.execute('SELECT * FROM `Order` WHERE order_id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload-menu-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  res.json({ filePath: `/images/menu/${req.file.filename}` });
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute(
      'SELECT staff_id, staff_name, role, phone_number, username FROM Staff WHERE username = ? AND password = SHA2(?, 256)',
      [username, password]
    );
    if (rows.length > 0) {
      res.json({ success: true, staff: rows[0] });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/staff/change-password', async (req, res) => {
  try {
    const { staff_id, current_password, new_password } = req.body;
    const [rows] = await pool.execute(
      'SELECT staff_id FROM Staff WHERE staff_id = ? AND password = SHA2(?, 256)',
      [staff_id, current_password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }
    await query(
      'UPDATE Staff SET password = SHA2(?, 256) WHERE staff_id = ?',
      [new_password, staff_id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { username, staff_name, role, phone_number, password } = req.body;
    const [existing] = await pool.execute('SELECT staff_id FROM Staff WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    await query(
      'INSERT INTO Staff (staff_name, role, phone_number, username, password) VALUES (?, ?, ?, ?, SHA2(?, 256))',
      [staff_name || username, role || 'Waiter', phone_number || '', username, password]
    );
    const [rows] = await pool.execute('SELECT staff_id, staff_name, role, phone_number, username FROM Staff WHERE username = ?', [username]);
    res.status(201).json({ success: true, staff: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customers CRUD
app.post('/api/customers', async (req, res) => {
  try {
    const { customer_name, phone_number, email } = req.body;
    const result = await query(
      'INSERT INTO Customer (customer_name, phone_number, email) VALUES (?, ?, ?)',
      [customer_name, phone_number, email || null]
    );
    const [rows] = await pool.execute('SELECT * FROM Customer WHERE customer_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, phone_number, email } = req.body;
    await query(
      'UPDATE Customer SET customer_name = ?, phone_number = ?, email = ? WHERE customer_id = ?',
      [customer_name, phone_number, email || null, id]
    );
    const [rows] = await pool.execute('SELECT * FROM Customer WHERE customer_id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id, 10) === 1) {
      return res.status(400).json({ error: 'Cannot delete Walk-in Guest' });
    }
    await query('DELETE FROM Customer WHERE customer_id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff CRUD
app.post('/api/staff', async (req, res) => {
  try {
    const { staff_name, role, phone_number, username, password } = req.body;
    const [existing] = await pool.execute('SELECT staff_id FROM Staff WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    await query(
      'INSERT INTO Staff (staff_name, role, phone_number, username, password) VALUES (?, ?, ?, ?, SHA2(?, 256))',
      [staff_name, role, phone_number, username, password]
    );
    const [rows] = await pool.execute('SELECT staff_id, staff_name, role, phone_number, username FROM Staff WHERE username = ?', [username]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { staff_name, role, phone_number, username, password } = req.body;
    
    // Check if other staff has this username
    const [existing] = await pool.execute('SELECT staff_id FROM Staff WHERE username = ? AND staff_id != ?', [username, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already in use' });
    }

    if (password) {
      await query(
        'UPDATE Staff SET staff_name = ?, role = ?, phone_number = ?, username = ?, password = SHA2(?, 256) WHERE staff_id = ?',
        [staff_name, role, phone_number, username, password, id]
      );
    } else {
      await query(
        'UPDATE Staff SET staff_name = ?, role = ?, phone_number = ?, username = ? WHERE staff_id = ?',
        [staff_name, role, phone_number, username, id]
      );
    }

    const [rows] = await pool.execute('SELECT staff_id, staff_name, role, phone_number, username FROM Staff WHERE staff_id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Staff WHERE staff_id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Categories CRUD
app.post('/api/categories', async (req, res) => {
  try {
    const { category_name } = req.body;
    const result = await query('INSERT INTO Category (category_name) VALUES (?)', [category_name]);
    const [rows] = await pool.execute('SELECT * FROM Category WHERE category_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;
    await query('UPDATE Category SET category_name = ? WHERE category_id = ?', [category_name, id]);
    const [rows] = await pool.execute('SELECT * FROM Category WHERE category_id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Category WHERE category_id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Cannot delete category because menu items are currently linked to it.' });
  }
});

app.delete('/api/delete-menu-image', (req, res) => {
  try {
    const filePath = req.query.filePath;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Missing filePath query parameter' });
    }

    const normalized = path.posix.normalize(filePath);
    if (!normalized.startsWith('/images/menu/')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const fileName = normalized.replace('/images/menu/', '');
    const fullPath = path.resolve(uploadDir, fileName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static assets from Vite build (dist) if it exists
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/images')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #f9fafb; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box;">
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 500px; width: 100%; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-bottom: 10px; font-weight: 700;">Aura Ilham Backend</h2>
          <p style="color: #4b5563; line-height: 1.5;">The backend server is running successfully on port 4000.</p>
          <p style="color: #4b5563; line-height: 1.5; margin-bottom: 20px;">To open the frontend application, click the button below:</p>
          <a href="http://localhost:5173" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none;">
            Go to http://localhost:5173
          </a>
        </div>
      </div>
    `);
  });
}

app.listen(port, '0.0.0.0', async () => {
  try {
    await runMigrations();
    console.log(`Backend server is running on http://localhost:${port}`);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
});
