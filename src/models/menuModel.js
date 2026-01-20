import { query } from '../config/db.js';

export const getMenuByVendorId = async (vendorId) => {
  const sql = `SELECT * FROM menu_items WHERE vendor_id = $1 ORDER BY created_at DESC`;
  const result = await query(sql, [vendorId]);
  return result.rows;
};

export const addMenuItem = async (vendorId, itemData) => {
  const { name, price, description, category, image_url, discount_percentage } = itemData;
  const sql = `
    INSERT INTO menu_items (vendor_id, name, price, description, category, image_url, discount_percentage)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const result = await query(sql, [vendorId, name, price, description, category, image_url, discount_percentage || 0]);
  return result.rows[0];
};

export const updateMenuItem = async (itemId, data) => {
  const { price, is_available, name, description, category, image_url, discount_percentage } = data;
  
  const sql = `
    UPDATE menu_items 
    SET 
      price = COALESCE($1, price), 
      is_available = COALESCE($2, is_available),
      name = COALESCE($3, name),
      description = COALESCE($4, description),
      category = COALESCE($5, category),
      image_url = COALESCE($6, image_url),
      discount_percentage = COALESCE($7, discount_percentage)
    WHERE id = $8
    RETURNING *
  `;
  
  const result = await query(sql, [
    price, 
    is_available, 
    name, 
    description, 
    category, 
    image_url, 
    discount_percentage, 
    itemId
  ]);
  
  return result.rows[0];
};

export const getItemsByIds = async (ids) => {
  const sql = `SELECT id, price, discount_percentage FROM menu_items WHERE id = ANY($1::uuid[])`;
  const result = await query(sql, [ids]);
  return result.rows;
};