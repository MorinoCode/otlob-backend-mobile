import pool from '../config/db.js';

// دریافت همه Reports
export const getAllReports = async (filters = {}) => {
  const { status, type, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT 
      st.id, st.type, st.subject, st.description, st.status, 
      st.priority, st.created_at, st.updated_at, st.resolved_at,
      u.full_name as user_name, u.phone_number as user_phone,
      v.name as vendor_name,
      o.id as order_id
    FROM support_tickets st
    LEFT JOIN users u ON st.user_id = u.id
    LEFT JOIN vendors v ON st.vendor_id = v.id
    LEFT JOIN orders o ON st.order_id = o.id
  `;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`st.status = $${paramIndex++}`);
    params.push(status);
  }

  if (type) {
    conditions.push(`st.type = $${paramIndex++}`);
    params.push(type);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ` ORDER BY st.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await pool.query(sql, params);

  // Count total
  let countSql = 'SELECT COUNT(*) FROM support_tickets st';
  if (conditions.length > 0) {
    countSql += ' WHERE ' + conditions.join(' AND ');
  }
  const countParams = params.slice(0, -2);
  const countResult = countParams.length > 0
    ? await pool.query(countSql, countParams)
    : await pool.query(countSql);

  return {
    reports: result.rows,
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit)
  };
};

// دریافت یک Report
export const getReportById = async (id) => {
  const sql = `
    SELECT 
      st.*,
      u.full_name as user_name, u.phone_number as user_phone,
      v.name as vendor_name,
      o.id as order_id
    FROM support_tickets st
    LEFT JOIN users u ON st.user_id = u.id
    LEFT JOIN vendors v ON st.vendor_id = v.id
    LEFT JOIN orders o ON st.order_id = o.id
    WHERE st.id = $1
  `;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

// ایجاد Report
export const createReport = async (data) => {
  const { user_id, vendor_id, order_id, type, subject, description, image_url } = data;
  
  const sql = `
    INSERT INTO support_tickets 
    (user_id, vendor_id, order_id, type, subject, description, image_url, status, priority)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', 'medium')
    RETURNING *
  `;
  const result = await pool.query(sql, [
    user_id || null,
    vendor_id || null,
    order_id || null,
    type || 'general',
    subject,
    description,
    image_url || null
  ]);
  return result.rows[0];
};

// به‌روزرسانی Report
export const updateReport = async (id, data) => {
  const { status, priority, resolution, assigned_to } = data;
  
  const sql = `
    UPDATE support_tickets 
    SET 
      status = COALESCE($1, status),
      priority = COALESCE($2, priority),
      resolution = COALESCE($3, resolution),
      assigned_to = COALESCE($4, assigned_to),
      updated_at = CURRENT_TIMESTAMP,
      resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
    WHERE id = $5
    RETURNING *
  `;
  const result = await pool.query(sql, [status, priority, resolution, assigned_to, id]);
  return result.rows[0];
};

// حذف Report
export const deleteReport = async (id) => {
  const sql = 'DELETE FROM support_tickets WHERE id = $1 RETURNING id';
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};
