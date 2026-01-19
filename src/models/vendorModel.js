import pool from '../config/db.js';

// ایجاد وندور جدید با پشتیبانی کامل PostGIS
export const createVendor = async (data) => {
  const { name, menu_image_url, longitude, latitude, address, phone, category } = data;

  const sql = `
    INSERT INTO vendors (
      name, 
      menu_image_url, 
      latitude, 
      longitude, 
      location, -- ستون هوشمند PostGIS
      address, 
      phone, 
      category,
      is_active, 
      is_open
    )
    VALUES (
      $1, $2, $3, $4, 
      ST_SetSRID(ST_MakePoint($4, $3), 4326), -- تبدیل اتوماتیک به Geometry
      $5, $6, $7, true, true
    )
    RETURNING *;
  `;

  // اگر کتگوری ارسال نشد، پیش‌فرض Burger باشد
  const values = [name, menu_image_url, latitude, longitude, address, phone, category || 'Burger'];
  
  const result = await pool.query(sql, values);
  return result.rows[0];
};

// دریافت رستوران‌های نزدیک با استفاده از قدرت محاسباتی PostGIS
export const getNearbyVendors = async (userLong, userLat) => {
  const sql = `
    SELECT 
      id, 
      name, 
      menu_image_url, 
      category, 
      rating, 
      is_open, 
      address, 
      phone,
      latitude, 
      longitude,
      -- محاسبه فاصله دقیق به متر (اختیاری برای آینده)
      ST_Distance(
        location::geography, 
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) as distance_meters
    FROM vendors
    WHERE is_active = true
    -- مرتب‌سازی بر اساس "نزدیک‌ترین همسایه" (KNN) که بسیار سریع است
    ORDER BY location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
    LIMIT 20;
  `;

  const result = await pool.query(sql, [userLong, userLat]);
  return result.rows;
};

// آمار فروش وندور
export const getVendorStats = async (vendorId) => {
  const sql = `
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total_price), 0) as total_revenue
    FROM orders 
    WHERE vendor_id = $1 
    AND status = 'COMPLETED'
    AND created_at >= CURRENT_DATE;
  `;
  const result = await pool.query(sql, [vendorId]);
  return result.rows[0];
};