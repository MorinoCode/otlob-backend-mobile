import pool from '../config/db.js';

// ایجاد درخواست جدید
export const createVendorRequest = async (data) => {
  const {
    restaurant_name,
    owner_name,
    email,
    phone,
    address,
    category,
    description,
    logo_url
  } = data;

  const sql = `
    INSERT INTO vendor_requests 
    (restaurant_name, owner_name, email, phone, address, category, description, logo_url, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
    RETURNING *
  `;

  const result = await pool.query(sql, [
    restaurant_name,
    owner_name,
    email,
    phone,
    address || null,
    category || null,
    description || null,
    logo_url || null
  ]);

  return result.rows[0];
};

// دریافت همه درخواست‌ها
export const getAllVendorRequests = async (filters = {}) => {
  const { status, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT 
      vr.*,
      a.full_name as reviewed_by_name
    FROM vendor_requests vr
    LEFT JOIN admins a ON vr.reviewed_by = a.id
  `;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`vr.status = $${paramIndex++}`);
    params.push(status);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ` ORDER BY vr.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await pool.query(sql, params);

  // Count total
  let countSql = 'SELECT COUNT(*) FROM vendor_requests vr';
  if (conditions.length > 0) {
    countSql += ' WHERE ' + conditions.join(' AND ');
  }
  const countParams = params.slice(0, -2);
  const countResult = countParams.length > 0
    ? await pool.query(countSql, countParams)
    : await pool.query(countSql);

  return {
    requests: result.rows,
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit)
  };
};

// دریافت یک درخواست
export const getVendorRequestById = async (id) => {
  const sql = `
    SELECT 
      vr.*,
      a.full_name as reviewed_by_name
    FROM vendor_requests vr
    LEFT JOIN admins a ON vr.reviewed_by = a.id
    WHERE vr.id = $1
  `;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

// به‌روزرسانی وضعیت درخواست
export const updateVendorRequestStatus = async (id, data) => {
  const { status, reviewed_by, admin_notes } = data;

  const sql = `
    UPDATE vendor_requests 
    SET 
      status = $1,
      reviewed_by = $2,
      reviewed_at = CASE WHEN $1 != 'pending' THEN CURRENT_TIMESTAMP ELSE reviewed_at END,
      admin_notes = COALESCE($3, admin_notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
  `;

  const result = await pool.query(sql, [
    status,
    reviewed_by || null,
    admin_notes || null,
    id
  ]);

  return result.rows[0];
};

// حذف درخواست
export const deleteVendorRequest = async (id) => {
  const sql = 'DELETE FROM vendor_requests WHERE id = $1 RETURNING id';
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};
