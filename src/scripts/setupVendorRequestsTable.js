import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupVendorRequestsTable = async () => {
  try {
    console.log('🔄 Creating vendor_requests table...');
    
    const sqlFile = path.join(__dirname, '../database/create_vendor_requests_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Vendor requests table created successfully!');
  } catch (error) {
    console.error('❌ Error creating vendor requests table:', error.message);
    
    if (error.message.includes('already exists') || error.code === '42P07') {
      console.log('ℹ️  Table already exists, skipping...');
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
};

setupVendorRequestsTable();
