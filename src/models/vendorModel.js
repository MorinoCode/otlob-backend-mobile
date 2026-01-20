import pool from '../config/db.js';

export const createVendor = async (data) => {
  const { name, menu_image_url, longitude, latitude, address, phone, category } = data;

  const sql = `
    INSERT INTO vendors (
      name, menu_image_url, latitude, longitude, location, 
      address, phone, category, is_active, is_open, password
    )
    VALUES (
      $1, $2, $3, $4, 
      ST_SetSRID(ST_MakePoint($4, $3), 4326), 
      $5, $6, $7, true, true, '123456'
    )
    RETURNING *;
  `;

  const values = [name, menu_image_url, latitude, longitude, address, phone, category || 'Burger'];
  const result = await pool.query(sql, values);
  return result.rows[0];
};


export const getAll = async () => {
  const sql = `
    SELECT 
      v.id, 
      v.name, 
      v.menu_image_url, 
      v.category, 
      v.rating, 
      v.is_open, 
      v.address, 
      v.phone, 
      v.latitude, 
      v.longitude,
      COALESCE(
        (SELECT COUNT(*)::int 
         FROM orders o 
         WHERE o.vendor_id = v.id AND o.rating IS NOT NULL), 
        0
      ) as rating_count
    FROM vendors v
    WHERE v.is_active = true
    LIMIT 50;
  `;
  const result = await pool.query(sql);
  return result.rows;
};

export const getNearbyVendors = async (userLong, userLat) => {
  const sql = `
    SELECT 
      v.id, 
      v.name, 
      v.menu_image_url, 
      v.category, 
      v.rating, 
      v.is_open, 
      v.address, 
      v.phone, 
      v.latitude, 
      v.longitude,
      COALESCE(
        (SELECT COUNT(*)::int 
         FROM orders o 
         WHERE o.vendor_id = v.id AND o.rating IS NOT NULL), 
        0
      ) as rating_count,
      ST_Distance(
        v.location::geography, 
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) as distance_meters
    FROM vendors v
    WHERE v.is_active = true
    ORDER BY v.location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
    LIMIT 20;
  `;
  const result = await pool.query(sql, [userLong, userLat]);
  return result.rows;
};

export const getVendorDetails = async (vendorId) => {
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
      longitude
    FROM vendors
    WHERE id = $1 AND is_active = true
  `;
  const result = await pool.query(sql, [vendorId]);
  if (result.rows.length === 0) return null;
  
  const vendor = result.rows[0];
  
  // Get rating count (number of orders with rating)
  const ratingCountSql = `
    SELECT COUNT(*) as count
    FROM orders
    WHERE vendor_id = $1 AND rating IS NOT NULL
  `;
  const ratingCountResult = await pool.query(ratingCountSql, [vendorId]);
  vendor.rating_count = parseInt(ratingCountResult.rows[0].count) || 0;
  
  return vendor;
};

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

export const verifyVendorCredentials = async (vendorId, password) => {
  const sql = `SELECT * FROM vendors WHERE id = $1 AND password = $2`;
  const result = await pool.query(sql, [vendorId, password]);
  return result.rows[0];
};

export const getOrderByVendorAndId = async (vendorId, orderId) => {
  const sql = `SELECT id FROM orders WHERE id = $1 AND vendor_id = $2`;
  const result = await pool.query(sql, [orderId, vendorId]);
  return result.rows[0];
};

export const getOrderStatusEnumValues = async () => {
  try {
    // Get enum values from PostgreSQL - try different enum type names
    let sql = `SELECT unnest(enum_range(NULL::order_status))::text as enum_value`;
    try {
      const result = await pool.query(sql);
      return result.rows.map(row => row.enum_value);
    } catch (e) {
      // Try to get distinct status values from existing orders
      sql = `SELECT DISTINCT status::text as enum_value FROM orders ORDER BY enum_value`;
      const result = await pool.query(sql);
      return result.rows.map(row => row.enum_value);
    }
  } catch (error) {
    console.error('Error getting enum values:', error.message);
    // Return default values if enum query fails
    return null;
  }
};

export const getVendorOrdersWithDetails = async (vendorId) => {
  // Get orders with basic info
  const ordersSql = `
    SELECT 
      o.id,
      o.total_price,
      o.status,
      o.created_at,
      o.customer_note,
      u.phone_number as customer_phone,
      c.model as car_model,
      c.plate_number as car_plate
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN cars c ON o.car_id = c.id
    WHERE o.vendor_id = $1
    AND o.status != 'COMPLETED'
    ORDER BY o.created_at DESC
    LIMIT 50
  `;
  
  const ordersResult = await pool.query(ordersSql, [vendorId]);
  const orders = ordersResult.rows;
  
  // Get items for each order
  for (const order of orders) {
    const itemsSql = `
      SELECT 
        oi.quantity,
        oi.price_at_order as price,
        mi.name
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
    `;
    const itemsResult = await pool.query(itemsSql, [order.id]);
    order.items = itemsResult.rows;
  }
  
  return orders;
};

export const getVendorCompletedOrders = async (vendorId, startDate = null, endDate = null) => {
  // Build query with optional date filters
  let ordersSql = `
    SELECT 
      o.id,
      o.total_price,
      o.status,
      o.created_at,
      o.customer_note,
      u.phone_number as customer_phone,
      c.model as car_model,
      c.plate_number as car_plate
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN cars c ON o.car_id = c.id
    WHERE o.vendor_id = $1
    AND o.status = 'COMPLETED'
  `;
  
  const params = [vendorId];
  let paramIndex = 2;
  
  if (startDate) {
    ordersSql += ` AND o.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }
  
  if (endDate) {
    ordersSql += ` AND o.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }
  
  ordersSql += ` ORDER BY o.created_at DESC LIMIT 100`;
  
  const ordersResult = await pool.query(ordersSql, params);
  const orders = ordersResult.rows;
  
  // Get items for each order
  for (const order of orders) {
    const itemsSql = `
      SELECT 
        oi.quantity,
        oi.price_at_order as price,
        mi.name
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
    `;
    const itemsResult = await pool.query(itemsSql, [order.id]);
    order.items = itemsResult.rows;
  }
  
  return orders;
};