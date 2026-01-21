-- جدول Admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'support_admin', -- super_admin, support_admin, sales_admin, content_admin, operations_admin
  permissions JSONB DEFAULT '{}'::jsonb, -- دسترسی‌های خاص
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- جدول Admin Permissions (برای انعطاف بیشتر)
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL, -- 'view_vendors', 'edit_vendors', 'delete_users', 'send_notifications', etc.
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(admin_id, permission)
);

-- جدول Support Tickets / Reports
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'complaint', -- 'complaint', 'bug', 'feature_request', 'general'
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  assigned_to UUID REFERENCES admins(id) ON DELETE SET NULL,
  resolution TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- ایجاد ایندکس‌ها برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_admin_id ON admin_permissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_vendor_id ON support_tickets(vendor_id);

-- Super Admin باید با script createSuperAdmin.js ایجاد شود
