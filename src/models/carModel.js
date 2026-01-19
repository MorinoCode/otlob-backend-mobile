import { query } from '../config/db.js';

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