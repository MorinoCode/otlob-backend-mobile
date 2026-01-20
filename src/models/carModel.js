import { query, default as pool } from '../config/db.js';

// اضافه کردن ماشین جدید
export const createCar = async (userId, carData) => {
  const { model, color, plate_number, is_default } = carData;
  
  const sql = `
    INSERT INTO cars (user_id, model, color, plate_number, is_default)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const result = await query(sql, [
    userId, 
    model, 
    color, 
    plate_number || '', // اگر پلاک خالی بود رشته خالی بذار
    is_default || false
  ]);
  
  return result.rows[0];
};

// گرفتن لیست ماشین‌های کاربر
export const getUserCars = async (userId) => {
  const result = await query('SELECT * FROM cars WHERE user_id = $1 ORDER BY is_default DESC', [userId]);
  return result.rows;
};

// تنظیم یک ماشین به عنوان پیش‌فرض
export const setDefault = async (userId, carId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Unset old default
    await client.query('UPDATE cars SET is_default = false WHERE user_id = $1', [userId]);
    // Set new default
    const result = await client.query('UPDATE cars SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *', [carId, userId]);
    await client.query('COMMIT');
    
    if (result.rows.length === 0) {
      throw new Error('Car not found or user not authorized');
    }
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};