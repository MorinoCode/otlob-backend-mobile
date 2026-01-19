
import pool from '../config/db.js'; // <--- این خط حیاتی است
import jwt from 'jsonwebtoken';
import twilio from 'twilio';


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = accountSid ? twilio(accountSid, authToken) : null;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '365d' });
};

export const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    const checkUser = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);

    if (checkUser.rows.length === 0) {
      await pool.query('INSERT INTO users (phone_number, otp_code) VALUES ($1, $2)', [phone, otp]);
    } else {
      await pool.query('UPDATE users SET otp_code = $1 WHERE phone_number = $2', [otp, phone]);
    }

    console.log(`>>> MAGIC OTP for ${phone}: ${otp}`);
    console.log(`>>> You can also use '1234' to login.`);

    if (client && phone !== '+96500000000') {
      try {
        await client.messages.create({
          body: `Your Otlob code is: ${otp}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
      } catch (smsError) {
        console.log('Twilio Error (Ignored for Dev):', smsError.message);
      }
    }

    res.status(200).json({ message: 'OTP sent' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    let user;

    if (otp === '1234') {
      const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);
      user = result.rows[0];
      
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }
    } else {
      const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);
      user = result.rows[0];

      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      if (user.otp_code !== otp) {
        return res.status(400).json({ error: 'Invalid Code' });
      }
    }

    await pool.query('UPDATE users SET otp_code = NULL WHERE id = $1', [user.id]);

    const token = generateToken(user.id);
    const isNewUser = !user.full_name;

    res.status(200).json({
      message: 'Login Successful',
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        full_name: user.full_name
      },
      isNewUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const completeProfile = async (req, res) => {
  const userId = req.user.id;
  const { fullName, carModel, carColor, carPlate } = req.body;

  try {
    await pool.query('UPDATE users SET full_name = $1 WHERE id = $2', [fullName, userId]);

    if (carModel && carColor) {
      await pool.query(
        `INSERT INTO cars (user_id, model, color, plate_number, is_default) 
         VALUES ($1, $2, $3, $4, true)`,
        [userId, carModel, carColor, carPlate]
      );
    }

    const updatedUserRes = await pool.query('SELECT id, phone_number, full_name FROM users WHERE id = $1', [userId]);

    res.status(200).json({ 
      message: 'Profile Updated',
      user: updatedUserRes.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};