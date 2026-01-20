import pool from "../config/db.js";

export const createOrderTransaction = async (userId, orderData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // اضافه کردن customer_note به ورودی‌ها
    const {
      vendor_id,
      car_id,
      payment_method,
      pickup_time,
      items,
      customer_note,
    } = orderData;

    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      // 1. دریافت قیمت و تخفیف از دیتابیس
      const priceRes = await client.query(
        "SELECT price, discount_percentage, name FROM menu_items WHERE id = $1",
        [item.menu_item_id],
      );

      if (priceRes.rows.length === 0) {
        throw new Error(`Menu item ${item.menu_item_id} not found`);
      }

      const { price, discount_percentage, name } = priceRes.rows[0];
      const originalPrice = parseFloat(price);
      const discount = discount_percentage || 0;

      // 2. محاسبه قیمت نهایی با اعمال تخفیف
      const finalPrice = originalPrice - originalPrice * (discount / 100);

      calculatedTotal += finalPrice * item.quantity;

      processedItems.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price_at_order: finalPrice, // قیمت نهایی ذخیره شود
      });
    }

    // اضافه کردن customer_note به کوئری INSERT
    const orderSql = `
      INSERT INTO orders (user_id, vendor_id, car_id, payment_method, total_price, pickup_time, status, customer_note)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
      RETURNING *
    `;

    const orderResult = await client.query(orderSql, [
      userId,
      vendor_id,
      car_id,
      payment_method,
      calculatedTotal,
      pickup_time,
      customer_note, // ذخیره یادداشت مشتری
    ]);
    const newOrder = orderResult.rows[0];

    for (const item of processedItems) {
      const itemSql = `
        INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(itemSql, [
        newOrder.id,
        item.menu_item_id,
        item.quantity,
        item.price_at_order,
      ]);
    }

    await client.query("COMMIT");
    return newOrder;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Helper function to get complete order details with all relations
export const getOrderWithDetails = async (orderId) => {
  const orderSql = `
    SELECT 
      o.*,
      u.phone_number as customer_phone,
      c.model as car_model,
      c.plate_number as car_plate,
      v.name as vendor_name,
      v.phone as vendor_phone,
      v.latitude as vendor_latitude,
      v.longitude as vendor_longitude,
      v.address as vendor_address
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN cars c ON o.car_id = c.id
    LEFT JOIN vendors v ON o.vendor_id = v.id
    WHERE o.id = $1
  `;
  
  const orderResult = await pool.query(orderSql, [orderId]);
  if (orderResult.rows.length === 0) return null;
  
  const order = orderResult.rows[0];
  
  // Get order items
  const itemsSql = `
    SELECT 
      oi.quantity,
      oi.price_at_order as price,
      mi.name
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = $1
  `;
  
  const itemsResult = await pool.query(itemsSql, [orderId]);
  order.items = itemsResult.rows;
  
  return order;
};

export const getUserOrders = async (userId) => {
  const sql = `
    SELECT 
      o.id, 
      o.total_price, 
      o.status, 
      o.created_at, 
      o.vendor_id,
      o.car_id,
      o.customer_note, -- دریافت یادداشت در لیست سفارشات
      v.name as vendor_name, 
      v.menu_image_url,
      v.phone as vendor_phone -- دریافت شماره تلفن رستوران برای قابلیت تماس
    FROM orders o
    JOIN vendors v ON o.vendor_id = v.id
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC
  `;
  const result = await pool.query(sql, [userId]);
  return result.rows;
};

export const updateOrderStatusDb = async (orderId, status) => {
  // Cast to enum type explicitly using :: syntax
  // Make sure status is uppercase to match enum values
  const upperStatus = status.toUpperCase();
  const sql = `
    UPDATE orders 
    SET status = $1::order_status
    WHERE id = $2 
    RETURNING *
  `;
  const result = await pool.query(sql, [upperStatus, orderId]);
  return result.rows[0];
};

export const getOrderById = async (orderId) => {
  // اضافه کردن JOIN برای گرفتن اطلاعات ماشین و رستوران در صفحه جزئیات
  const sql = `
    SELECT 
      o.*, 
      v.name as vendor_name, 
      v.phone as vendor_phone,
      v.latitude as vendor_latitude,
      v.longitude as vendor_longitude,
      v.address as vendor_address,
      c.model as car_model,
      c.plate_number as car_plate
    FROM orders o
    JOIN vendors v ON o.vendor_id = v.id
    JOIN cars c ON o.car_id = c.id
    WHERE o.id = $1
  `;
  const result = await pool.query(sql, [orderId]);
  return result.rows[0];
};
export const rateOrderDb = async (orderId, rating) => {
  const sql = `
    UPDATE orders 
    SET rating = $1 
    WHERE id = $2 
    RETURNING *
  `;
  const result = await pool.query(sql, [rating, orderId]);
  return result.rows[0];
};
export const getOrderItems = async (orderId) => {
  const sql = `
    SELECT 
      oi.menu_item_id as id, 
      mi.name, 
      mi.price, 
      oi.quantity 
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = $1
  `;
  const result = await pool.query(sql, [orderId]);
  return result.rows;
};
