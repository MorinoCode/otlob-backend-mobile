import pool from '../config/db.js';

export const verifyVendor = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    
    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    // Verify vendor exists
    const result = await pool.query('SELECT id, name FROM vendors WHERE id = $1', [vendorId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    req.vendor = result.rows[0];
    next();
  } catch (error) {
    console.error('Vendor verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
