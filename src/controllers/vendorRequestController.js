import * as vendorRequestModel from '../models/vendorRequestModel.js';

// ایجاد درخواست جدید (Public)
export const createVendorRequest = async (req, res) => {
  try {
    const {
      restaurant_name,
      owner_name,
      email,
      phone,
      address,
      category,
      description,
      logo_url
    } = req.body;

    if (!restaurant_name || !owner_name || !email || !phone) {
      return res.status(400).json({
        error: 'Restaurant name, owner name, email, and phone are required'
      });
    }

    const request = await vendorRequestModel.createVendorRequest({
      restaurant_name,
      owner_name,
      email,
      phone,
      address,
      category,
      description,
      logo_url
    });

    res.status(201).json({
      message: 'Vendor request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Create Vendor Request Error:', error);
    
    // Handle duplicate email constraint
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Server error' });
  }
};

// دریافت همه درخواست‌ها (Admin Only)
export const getAllVendorRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await vendorRequestModel.getAllVendorRequests({
      status,
      page,
      limit
    });
    res.json(result);
  } catch (error) {
    console.error('Get All Vendor Requests Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// دریافت یک درخواست (Admin Only)
export const getVendorRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await vendorRequestModel.getVendorRequestById(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ request });
  } catch (error) {
    console.error('Get Vendor Request Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// به‌روزرسانی وضعیت درخواست (Admin Only)
export const updateVendorRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, admin_notes } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await vendorRequestModel.updateVendorRequestStatus(requestId, {
      status,
      reviewed_by: req.admin.id,
      admin_notes
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Update Vendor Request Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// حذف درخواست (Admin Only)
export const deleteVendorRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await vendorRequestModel.deleteVendorRequest(requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete Vendor Request Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
