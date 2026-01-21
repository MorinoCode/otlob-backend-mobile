import jwt from 'jsonwebtoken';
import * as adminModel from '../models/adminModel.js';

// بررسی اینکه آیا Admin است
export const verifyAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      const admin = await adminModel.findById(decoded.id);
      
      if (!admin) {
        return res.status(401).json({ error: 'Admin not found' });
      }

      if (!admin.is_active) {
        return res.status(403).json({ error: 'Admin account is deactivated' });
      }

      req.admin = admin;
      next();
    } catch (error) {
      console.error('Admin Auth Error:', error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

// بررسی دسترسی خاص (Role-Based)
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (roles.includes(req.admin.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Required role: ' + roles.join(' or ') });
    }
  };
};

// بررسی دسترسی Super Admin
export const requireSuperAdmin = requireRole('super_admin');

// بررسی Permission خاص
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Super Admin دسترسی کامل دارد
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // بررسی permission در permissions JSON
    const permissions = req.admin.permissions || {};
    if (permissions[permission] === true || permissions.all === true) {
      next();
    } else {
      res.status(403).json({ error: `Access denied. Required permission: ${permission}` });
    }
  };
};
