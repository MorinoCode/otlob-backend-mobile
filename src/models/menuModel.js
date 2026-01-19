import { query } from '../config/db.js';

// دریافت منوی یک رستوران خاص
export const getMenuByVendorId = async (vendorId) => {
  const sql = `SELECT * FROM menu_items WHERE vendor_id = $1 AND is_available = TRUE`;
  const result = await query(sql, [vendorId]);
  return result.rows;
};

// اضافه کردن غذا به منو
export const addMenuItem = async (vendorId, itemData) => {
  const { name, price, description, category, image_url } = itemData;
  const sql = `
    INSERT INTO menu_items (vendor_id, name, price, description, category, image_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await query(sql, [vendorId, name, price, description, category, image_url]);
  return result.rows[0];
};

// دریافت قیمت و اطلاعات چند آیتم با هم (برای محاسبه فاکتور)
export const getItemsByIds = async (ids) => {
  const sql = `SELECT id, price FROM menu_items WHERE id = ANY($1::uuid[])`;
  const result = await query(sql, [ids]);
  return result.rows;
};

export const updateMenuItem = async (itemId, data) => {
  const { price, is_available } = data;
  const sql = `
    UPDATE menu_items 
    SET price = COALESCE($1, price), 
        is_available = COALESCE($2, is_available)
    WHERE id = $3
    RETURNING *
  `;
  const result = await query(sql, [price, is_available, itemId]);
  return result.rows[0];
};