import pool from '../config/db.js';

export const createOrderTransaction = async (userId, orderData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { vendor_id, car_id, payment_method, pickup_time, items } = orderData;

    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      const priceRes = await client.query('SELECT price FROM menu_items WHERE id = $1', [item.menu_item_id]);
      
      if (priceRes.rows.length === 0) {
        throw new Error(`Menu item ${item.menu_item_id} not found`);
      }

      const price = parseFloat(priceRes.rows[0].price);
      calculatedTotal += price * item.quantity;
      
      processedItems.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price_at_order: price
      });
    }

    const orderSql = `
      INSERT INTO orders (user_id, vendor_id, car_id, payment_method, total_price, pickup_time, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
      RETURNING *
    `;
    
    const orderResult = await client.query(orderSql, [
      userId, vendor_id, car_id, payment_method, calculatedTotal, pickup_time
    ]);
    const newOrder = orderResult.rows[0];

    for (const item of processedItems) {
      const itemSql = `
        INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(itemSql, [newOrder.id, item.menu_item_id, item.quantity, item.price_at_order]);
    }

    await client.query('COMMIT');
    return newOrder;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
      v.name as vendor_name, 
      v.menu_image_url
    FROM orders o
    JOIN vendors v ON o.vendor_id = v.id
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC
  `;
  const result = await pool.query(sql, [userId]);
  return result.rows;
};

export const updateOrderStatusDb = async (orderId, status) => {
  const sql = `
    UPDATE orders 
    SET status = $1 
    WHERE id = $2 
    RETURNING *
  `;
  const result = await pool.query(sql, [status, orderId]);
  return result.rows[0];
};

export const getOrderById = async (orderId) => {
  const sql = `SELECT * FROM orders WHERE id = $1`;
  const result = await pool.query(sql, [orderId]);
  return result.rows[0];
};