import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

const createSuperAdmin = async () => {
  try {
    const email = 'admin@otlob.com';
    const password = 'admin123'; // در production باید تغییر داده شود
    const fullName = 'Super Admin';
    const role = 'super_admin';

    // بررسی اینکه آیا admin وجود دارد
    const checkResult = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Super Admin already exists!');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // ایجاد Super Admin
    const result = await pool.query(
      `INSERT INTO admins (email, password_hash, full_name, role, permissions, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, full_name, role`,
      [email, passwordHash, fullName, role, JSON.stringify({ all: true })]
    );

    console.log('✅ Super Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('⚠️  Please change the password in production!');
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
  } finally {
    await pool.end();
  }
};

createSuperAdmin();
