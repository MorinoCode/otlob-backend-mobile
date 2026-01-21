-- جدول درخواست‌های عضویت رستوران‌ها
CREATE TABLE IF NOT EXISTS vendor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  category VARCHAR(100),
  description TEXT,
  logo_url TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ایجاد ایندکس‌ها
CREATE INDEX IF NOT EXISTS idx_vendor_requests_status ON vendor_requests(status);
CREATE INDEX IF NOT EXISTS idx_vendor_requests_email ON vendor_requests(email);
CREATE INDEX IF NOT EXISTS idx_vendor_requests_created_at ON vendor_requests(created_at);
