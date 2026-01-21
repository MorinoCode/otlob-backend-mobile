import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupAdminTables = async () => {
  try {
    console.log('🔄 Creating admin tables...');
    
    // خواندن فایل SQL
    const sqlFile = path.join(__dirname, '../database/create_admin_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // اجرای SQL
    await pool.query(sql);
    
    console.log('✅ Admin tables created successfully!');
    console.log('✅ Now you can run: node src/scripts/createSuperAdmin.js');
  } catch (error) {
    console.error('❌ Error creating admin tables:', error.message);
    
    // اگر جدول از قبل وجود دارد، خطا نده
    if (error.message.includes('already exists') || error.code === '42P07') {
      console.log('ℹ️  Tables already exist, skipping...');
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
};

setupAdminTables();
