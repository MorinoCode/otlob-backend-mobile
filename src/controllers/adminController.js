import jwt from 'jsonwebtoken';
import * as adminModel from '../models/adminModel.js';
import * as vendorModel from '../models/vendorModel.js';
import * as userModel from '../models/userModel.js';
import * as orderModel from '../models/orderModel.js';
import * as reportModel from '../models/reportModel.js';
import * as menuModel from '../models/menuModel.js';
import pool from '../config/db.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
};

// Login Admin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await adminModel.findByEmail(email);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isPasswordValid = await adminModel.verifyPassword(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await adminModel.updateLastLogin(admin.id);

    const token = generateToken(admin.id);

    // حذف password_hash از پاسخ
    const { password_hash, ...adminData } = admin;

    res.json({
      token,
      admin: adminData
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Admin Profile
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await adminModel.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ admin });
  } catch (error) {
    console.error('Get Admin Profile Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    // تعداد کل رستوران‌ها
    const vendorsCount = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as active_vendors,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_vendors,
        COUNT(*) as total_vendors
      FROM vendors
    `);

    // تعداد کل کاربران
    const usersCount = await pool.query(`
      SELECT COUNT(*) as total_users FROM users
    `);

    // آمار سفارش‌های امروز
    const todayOrders = await pool.query(`
      SELECT 
        COUNT(*) as today_orders,
        COALESCE(SUM(total_price), 0) as today_revenue
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    // آمار سفارش‌های هفته
    const weekOrders = await pool.query(`
      SELECT 
        COUNT(*) as week_orders,
        COALESCE(SUM(total_price), 0) as week_revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);

    // آمار سفارش‌های ماه
    const monthOrders = await pool.query(`
      SELECT 
        COUNT(*) as month_orders,
        COALESCE(SUM(total_price), 0) as month_revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // آخرین سفارش‌ها
    const recentOrders = await pool.query(`
      SELECT 
        o.id, o.status, o.total_price, o.created_at,
        u.full_name as user_name,
        v.name as vendor_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN vendors v ON o.vendor_id = v.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        vendors: vendorsCount.rows[0],
        users: {
          total: parseInt(usersCount.rows[0].total_users)
        },
        today: todayOrders.rows[0],
        week: weekOrders.rows[0],
        month: monthOrders.rows[0]
      },
      recentOrders: recentOrders.rows
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get All Vendors (برای Admin)
export const getAllVendorsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        v.id, v.name, v.category, v.rating, v.is_active, v.is_open,
        v.address, v.phone, v.created_at,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_revenue
      FROM vendors v
      LEFT JOIN orders o ON v.id = o.vendor_id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status === 'active') {
      conditions.push(`v.is_active = $${paramIndex++}`);
      params.push(true);
    } else if (status === 'inactive') {
      conditions.push(`v.is_active = $${paramIndex++}`);
      params.push(false);
    }

    if (search) {
      conditions.push(`(v.name ILIKE $${paramIndex++} OR v.category ILIKE $${paramIndex++})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += `
      GROUP BY v.id
      ORDER BY v.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await pool.query(sql, params);

    // Count total
    let countSql = 'SELECT COUNT(*) FROM vendors v';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await pool.query(countSql, countParams);

    res.json({
      vendors: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get All Vendors Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Toggle Vendor Active Status
export const toggleVendorStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { is_active } = req.body;

    const sql = `
      UPDATE vendors 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, is_active
    `;
    const result = await pool.query(sql, [is_active, vendorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ vendor: result.rows[0] });
  } catch (error) {
    console.error('Toggle Vendor Status Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get All Users (برای Admin)
export const getAllUsersForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        u.id, u.phone_number, u.full_name, u.created_at,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT c.id) as total_cars
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      LEFT JOIN cars c ON u.id = c.user_id
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` WHERE (u.full_name ILIKE $${paramIndex++} OR u.phone_number ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += `
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await pool.query(sql, params);

    // Count total
    let countSql = 'SELECT COUNT(*) FROM users u';
    if (search) {
      countSql += ` WHERE (u.full_name ILIKE $1 OR u.phone_number ILIKE $2)`;
    }
    const countResult = await search 
      ? await pool.query(countSql, [`%${search}%`, `%${search}%`])
      : await pool.query(countSql);

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get All Orders (برای Admin)
export const getAllOrdersForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, vendor_id, user_id } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        o.id, o.status, o.total_price, o.payment_method, o.created_at,
        u.full_name as user_name, u.phone_number as user_phone,
        v.name as vendor_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN vendors v ON o.vendor_id = v.id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`o.status = $${paramIndex++}`);
      params.push(status);
    }

    if (vendor_id) {
      conditions.push(`o.vendor_id = $${paramIndex++}`);
      params.push(vendor_id);
    }

    if (user_id) {
      conditions.push(`o.user_id = $${paramIndex++}`);
      params.push(user_id);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);

    // Count total
    let countSql = 'SELECT COUNT(*) FROM orders o';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = countParams.length > 0 
      ? await pool.query(countSql, countParams)
      : await pool.query(countSql);

    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get All Orders Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Reports Management ==========
export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const result = await reportModel.getAllReports({ page, limit, status, type });
    res.json(result);
  } catch (error) {
    console.error('Get All Reports Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await reportModel.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ report });
  } catch (error) {
    console.error('Get Report Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, priority, resolution, assigned_to } = req.body;
    
    const report = await reportModel.updateReport(reportId, {
      status, priority, resolution, assigned_to
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ report });
  } catch (error) {
    console.error('Update Report Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Admin Management ==========
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await adminModel.getAllAdmins();
    res.json({ admins });
  } catch (error) {
    console.error('Get All Admins Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { email, password, full_name, role, permissions } = req.body;
    
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full_name are required' });
    }

    const admin = await adminModel.createAdmin({ email, password, full_name, role, permissions });
    res.status(201).json({ admin });
  } catch (error) {
    console.error('Create Admin Error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { full_name, role, permissions, is_active } = req.body;
    
    const admin = await adminModel.updateAdmin(adminId, {
      full_name, role, permissions, is_active
    });
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json({ admin });
  } catch (error) {
    console.error('Update Admin Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await adminModel.changePassword(adminId, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Admin Password Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    // جلوگیری از حذف خود Admin
    if (adminId === req.admin.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const admin = await adminModel.deleteAdmin(adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete Admin Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Vendor Management ==========
export const getVendorById = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const sql = `
      SELECT 
        v.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_revenue,
        COALESCE(
          (SELECT COUNT(*)::int 
           FROM orders o 
           WHERE o.vendor_id = v.id AND o.rating IS NOT NULL), 
          0
        ) as rating_count
      FROM vendors v
      LEFT JOIN orders o ON v.id = o.vendor_id
      WHERE v.id = $1
      GROUP BY v.id
    `;
    const result = await pool.query(sql, [vendorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json({ vendor: result.rows[0] });
  } catch (error) {
    console.error('Get Vendor Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { name, address, phone, category, is_open, opening_time, closing_time } = req.body;
    
    const sql = `
      UPDATE vendors 
      SET 
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        phone = COALESCE($3, phone),
        category = COALESCE($4, category),
        is_open = COALESCE($5, is_open),
        opening_time = COALESCE($6, opening_time),
        closing_time = COALESCE($7, closing_time),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;
    const result = await pool.query(sql, [
      name, address, phone, category, is_open, opening_time, closing_time, vendorId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json({ vendor: result.rows[0] });
  } catch (error) {
    console.error('Update Vendor Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const changeVendorPassword = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const sql = `
      UPDATE vendors 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name
    `;
    const result = await pool.query(sql, [hashedPassword, vendorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json({ message: 'Password updated successfully', vendor: result.rows[0] });
  } catch (error) {
    console.error('Change Vendor Password Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getVendorMenu = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const menu = await menuModel.getMenuByVendorId(vendorId);
    res.json({ menu });
  } catch (error) {
    console.error('Get Vendor Menu Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== User Management ==========
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const sql = `
      SELECT 
        u.*,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT c.id) as total_cars,
        COALESCE(SUM(o.total_price), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      LEFT JOIN cars c ON u.id = c.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `;
    const result = await pool.query(sql, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's cars
    const carsResult = await pool.query('SELECT * FROM cars WHERE user_id = $1', [userId]);
    
    res.json({ 
      user: result.rows[0],
      cars: carsResult.rows
    });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, phone_number } = req.body;
    
    const sql = `
      UPDATE users 
      SET 
        full_name = COALESCE($1, full_name),
        phone_number = COALESCE($2, phone_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(sql, [full_name, phone_number, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ========== Order Details ==========
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.getOrderWithDetails(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ order });
  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
