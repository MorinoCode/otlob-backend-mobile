import { query } from '../config/db.js';



// ساخت کاربر جدید
export const createUser = async (phone, fullName) => {
  const result = await query(
    'INSERT INTO users (phone_number, full_name) VALUES ($1, $2) RETURNING *',
    [phone, fullName]
  );
  return result.rows[0];
};

// پیدا کردن کاربر با ID (برای چک کردن توکن در آینده)
export const findUserById = async (id) => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const findUserByPhone = async (phone) => {
  const result = await query('SELECT * FROM users WHERE phone_number = $1', [phone]);
  return result.rows[0];
};

export const upsertUserStart = async (phone) => {
  const check = await findUserByPhone(phone);
  if (check) {
    return check;
  }
  const result = await query(
    'INSERT INTO users (phone_number) VALUES ($1) RETURNING *',
    [phone]
  );
  return result.rows[0];
};

export const saveOtp = async (phone, otp) => {
  const expiresAt = new Date(Date.now() + 10 * 60000); 
  await query(
    'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE phone_number = $3',
    [otp, expiresAt, phone]
  );
};

export const verifyUserOtp = async (phone, otp) => {
  const result = await query(
    `SELECT * FROM users 
     WHERE phone_number = $1 
     AND otp_code = $2 
     AND otp_expires_at > NOW()`,
    [phone, otp]
  );
  return result.rows[0];
};

export const markUserVerified = async (id) => {
  await query('UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE id = $1', [id]);
};

export const updateUserProfile = async (id, fullName) => {
  const result = await query(
    'UPDATE users SET full_name = $1 WHERE id = $2 RETURNING *',
    [fullName, id]
  );
  return result.rows[0];
};