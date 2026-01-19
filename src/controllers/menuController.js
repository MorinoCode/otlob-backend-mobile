import * as menuModel from '../models/menuModel.js';

export const getVendorMenu = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const menu = await menuModel.getMenuByVendorId(vendorId);
    res.json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const addItem = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const item = await menuModel.addMenuItem(vendorId, req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updatedItem = await menuModel.updateMenuItem(itemId, req.body);
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};