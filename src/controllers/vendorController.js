import * as vendorModel from '../models/vendorModel.js';

export const addVendor = async (req, res) => {
  try {
    const { name, menu_image_url, longitude, latitude, address, phone, category } = req.body;

    if (!name || !longitude || !latitude) {
      return res.status(400).json({ error: 'Name and Coordinates (long, lat) are required' });
    }

    const newVendor = await vendorModel.createVendor({ 
      name, 
      menu_image_url, 
      longitude, 
      latitude, 
      address, 
      phone,
      category 
    });
    
    res.status(201).json(newVendor);
  } catch (error) {
    console.error('Add Vendor Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getNearby = async (req, res) => {
  try {
    const { long, lat } = req.query;

    if (!long || !lat) {
      return res.status(400).json({ error: 'User location (long, lat) is required' });
    }

    console.log(`📡 PostGIS Searching near: ${lat}, ${long}`);

    const vendors = await vendorModel.getNearbyVendors(long, lat);
    
    // فرمت‌دهی برای جلوگیری از کرش در فرانت‌اند
    // (تبدیل menu_image_url به image_url که فرانت لازم دارد)
    const formattedVendors = vendors.map(v => ({
      ...v,
      image_url: v.menu_image_url, 
    }));

    console.log(`📦 Found ${vendors.length} vendors via PostGIS`);

    res.json({
      count: formattedVendors.length,
      vendors: formattedVendors
    });
  } catch (error) {
    console.error('Get Nearby Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getStats = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const stats = await vendorModel.getVendorStats(vendorId);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};