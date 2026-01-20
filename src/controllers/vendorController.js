import * as vendorModel from '../models/vendorModel.js';
import * as orderModel from '../models/orderModel.js';

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await vendorModel.getAll();
    
    const formattedVendors = vendors.map(v => ({
      ...v,
      image_url: v.menu_image_url || '', 
      rating: v.rating || 'New'
    }));
    console.log(formattedVendors);

    res.json({
      count: formattedVendors.length,
      vendors: formattedVendors
    });
  } catch (error) {
    console.error('Get All Vendors Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const addVendor = async (req, res) => {
  try {
    const { name, menu_image_url, longitude, latitude, address, phone, category } = req.body;

    if (!name || !longitude || !latitude) {
      return res.status(400).json({ error: 'Name and Coordinates (long, lat) are required' });
    }

    const newVendor = await vendorModel.createVendor({ 
      name, menu_image_url, longitude, latitude, address, phone, category 
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

    const vendors = await vendorModel.getNearbyVendors(long, lat);
    
    const formattedVendors = vendors.map(v => ({
      ...v,
      // اگر نال بود، یک استرینگ خالی بفرست تا فرانت با پلیس‌هولدر پر کند
      image_url: v.menu_image_url || '', 
      rating: v.rating || 'New'
    }));

    res.json({
      count: formattedVendors.length,
      vendors: formattedVendors
    });
  } catch (error) {
    console.error('Get Nearby Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getVendorDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await vendorModel.getVendorDetails(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json(vendor);
  } catch (error) {
    console.error('Get Vendor Details Error:', error);
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

export const loginVendor = async (req, res) => {
  try {
    const { vendorId, password } = req.body;
    const vendor = await vendorModel.verifyVendorCredentials(vendorId, password);

    if (!vendor) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    res.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        menu_image_url: vendor.menu_image_url
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getVendorOrders = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const orders = await vendorModel.getVendorOrdersWithDetails(vendorId);
    res.json(orders);
  } catch (error) {
    console.error('Get Vendor Orders Error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getVendorCompletedOrders = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { startDate, endDate } = req.query; // Get date filters from query params
    const orders = await vendorModel.getVendorCompletedOrders(vendorId, startDate || null, endDate || null);
    res.json(orders);
  } catch (error) {
    console.error('Get Vendor Completed Orders Error:', error);
    res.status(500).json({ error: 'Failed to fetch completed orders' });
  }
};

export const updateVendorOrderStatus = async (req, res) => {
  try {
    const { vendorId, orderId } = req.params;
    let { status } = req.body;

    console.log(`\n📝 Updating order status:`);
    console.log(`   Vendor ID: ${vendorId}`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   New Status: ${status}`);

    // Valid enum values from database: PENDING, ACCEPTED, READY, COMPLETED, CANCELLED, COOKING
    const validStatuses = ['PENDING', 'ACCEPTED', 'COOKING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        validStatuses: validStatuses 
      });
    }

    // Validate status is one of the valid enum values
    // Valid values: PENDING, ACCEPTED, READY, COMPLETED, CANCELLED, COOKING
    const validEnumValues = ['PENDING', 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED', 'COOKING'];
    if (!validEnumValues.includes(status)) {
      console.log(`   ⚠️ Status ${status} not in valid enum values`);
      // Try to find case-insensitive match
      const matched = validEnumValues.find(v => v.toUpperCase() === status.toUpperCase());
      if (matched) {
        status = matched;
        console.log(`   ✅ Matched to: ${status}`);
      } else {
        return res.status(400).json({ 
          error: 'Invalid status', 
          validStatuses: validEnumValues 
        });
      }
    }

    // Verify order belongs to this vendor
    console.log(`   Verifying order belongs to vendor...`);
    const orderCheck = await vendorModel.getOrderByVendorAndId(vendorId, orderId);
    if (!orderCheck) {
      console.log(`   ❌ Order not found for this vendor`);
      return res.status(404).json({ error: 'Order not found for this vendor' });
    }
    console.log(`   ✅ Order verified`);

    console.log(`   Updating order status in database...`);
    const updatedOrder = await orderModel.updateOrderStatusDb(orderId, status);

    if (!updatedOrder) {
      console.log(`   ❌ Failed to update order`);
      return res.status(404).json({ error: 'Order not found' });
    }
    console.log(`   ✅ Order status updated successfully`);

    // Notify customer via socket
    try {
      const io = req.app.get('socketio');
      if (io) {
        io.to(`order_${orderId}`).emit('order_status_updated', {
          status: updatedOrder.status,
          orderId: updatedOrder.id
        });
        console.log(`   ✅ Customer notified via socket`);
      } else {
        console.log(`   ⚠️ Socket.io not available`);
      }
    } catch (socketErr) {
      console.error('   ⚠️ Status socket error:', socketErr.message);
    }

    console.log(`✅ Order status update completed\n`);
    res.json(updatedOrder);
  } catch (error) {
    console.error('\n❌ Update Vendor Order Status Error:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    console.error('');
    res.status(500).json({ error: 'Failed to update status', detail: error.message });
  }
};