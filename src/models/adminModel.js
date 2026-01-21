import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// پیدا کردن Admin با email
export const findByEmail = async (email) => {
  const sql = `
    SELECT 
      id, email, password_hash, full_name, role, permissions, 
      is_active, created_at, last_login
    FROM admins 
    WHERE email = $1
  `;
  const result = await pool.query(sql, [email]);
  return result.rows[0];
};

// پیدا کردن Admin با ID
export const findById = async (id) => {
  const sql = `
    SELECT 
      id, email, full_name, role, permissions, 
      is_active, created_at, last_login
    FROM admins 
    WHERE id = $1
  `;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

// بررسی رمز عبور
export const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// به‌روزرسانی last_login
export const updateLastLogin = async (id) => {
  const sql = `
    UPDATE admins 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = $1
  `;
  await pool.query(sql, [id]);
};

// دریافت همه Admins
export const getAllAdmins = async () => {
  const sql = `
    SELECT 
      id, email, full_name, role, permissions, 
      is_active, created_at, last_login
    FROM admins 
    ORDER BY created_at DESC
  `;
  const result = await pool.query(sql);
  return result.rows;
};

// ایجاد Admin جدید
export const createAdmin = async (data) => {
  const { email, password, full_name, role, permissions } = data;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const sql = `
    INSERT INTO admins (email, password_hash, full_name, role, permissions)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, full_name, role, permissions, is_active, created_at
  `;
  const result = await pool.query(sql, [
    email,
    hashedPassword,
    full_name,
    role || 'support_admin',
    JSON.stringify(permissions || {})
  ]);
  return result.rows[0];
};

// به‌روزرسانی Admin
export const updateAdmin = async (id, data) => {
  const { full_name, role, permissions, is_active } = data;
  
  const sql = `
    UPDATE admins 
    SET 
      full_name = COALESCE($1, full_name),
      role = COALESCE($2, role),
      permissions = COALESCE($3::jsonb, permissions),
      is_active = COALESCE($4, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING id, email, full_name, role, permissions, is_active, updated_at
  `;
  const result = await pool.query(sql, [
    full_name,
    role,
    permissions ? JSON.stringify(permissions) : null,
    is_active,
    id
  ]);
  return result.rows[0];
};

// تغییر رمز عبور Admin
export const changePassword = async (id, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const sql = `
    UPDATE admins 
    SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;
  await pool.query(sql, [hashedPassword, id]);
};

// حذف Admin
export const deleteAdmin = async (id) => {
  const sql = 'DELETE FROM admins WHERE id = $1 RETURNING id';
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};
