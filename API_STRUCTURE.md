# API Endpoints Structure

## 🔐 Authentication & User Management
**Base:** `/api/auth`
- `POST /api/auth/send-otp` - ارسال کد OTP
- `POST /api/auth/verify-otp` - تایید OTP و ورود
- `POST /api/auth/complete-profile` - تکمیل پروفایل کاربر

## 🚗 Car Management (Mobile App)
**Base:** `/api/cars`
- `POST /api/cars` - اضافه کردن ماشین جدید
- `GET /api/cars` - دریافت لیست ماشین‌های کاربر
- `PATCH /api/cars/:id/set-default` - تنظیم ماشین پیش‌فرض

## 🏪 Vendor Routes (Public + Protected)
**Base:** `/api/vendors`

### Public Routes (برای Mobile App)
- `POST /api/vendors` - ثبت رستوران جدید (admin فقط)
- `POST /api/vendors/login` - ورود vendor
- `GET /api/vendors/all` - لیست همه رستوران‌ها
- `GET /api/vendors/nearby` - رستوران‌های نزدیک
- `GET /api/vendors/:vendorId` - جزئیات یک رستوران

### Protected Routes (برای Vendor Dashboard)
- `GET /api/vendors/:vendorId/stats` - آمار فروش vendor
- `GET /api/vendors/:vendorId/orders` - سفارش‌های فعال vendor
- `GET /api/vendors/:vendorId/orders/completed` - سفارش‌های تکمیل شده
- `PATCH /api/vendors/:vendorId/orders/:orderId/status` - تغییر وضعیت سفارش

### Menu Routes (Nested)
**Base:** `/api/vendors/:vendorId/menu`
- `GET /api/vendors/:vendorId/menu` - دریافت منو
- `POST /api/vendors/:vendorId/menu` - اضافه کردن آیتم به منو

## 📦 Order Management (Mobile App)
**Base:** `/api/orders`
- `GET /api/orders/my` - سفارش‌های من (کاربر)
- `POST /api/orders` - ایجاد سفارش جدید
- `GET /api/orders/:orderId` - جزئیات سفارش
- `PATCH /api/orders/:orderId/status` - تغییر وضعیت (برای کاربر)
- `POST /api/orders/:orderId/rate` - امتیاز دادن به سفارش
- `GET /api/orders/:orderId/items` - لیست آیتم‌های سفارش

## 🍔 Menu Item Management
**Base:** `/api/items`
- `PATCH /api/items/:itemId` - ویرایش آیتم منو

## 📤 File Upload
**Base:** `/api/upload`
- `POST /api/upload` - آپلود فایل (تصویر)

## 👤 Admin Panel Routes
**Base:** `/api/admin`

### Public Routes
- `POST /api/admin/login` - ورود admin

### Protected Routes (Admin Only)
- `GET /api/admin/profile` - پروفایل admin
- `GET /api/admin/dashboard/stats` - آمار dashboard

### Vendors Management (Admin)
- `GET /api/admin/vendors` - لیست همه vendors (با فیلتر)
- `GET /api/admin/vendors/:vendorId` - جزئیات vendor
- `PATCH /api/admin/vendors/:vendorId` - ویرایش vendor
- `PATCH /api/admin/vendors/:vendorId/status` - فعال/غیرفعال کردن
- `PATCH /api/admin/vendors/:vendorId/password` - تغییر رمز vendor
- `GET /api/admin/vendors/:vendorId/menu` - مشاهده منو vendor

### Users Management (Admin)
- `GET /api/admin/users` - لیست همه کاربران
- `GET /api/admin/users/:userId` - جزئیات کاربر
- `PATCH /api/admin/users/:userId` - ویرایش کاربر

### Orders Management (Admin)
- `GET /api/admin/orders` - لیست همه سفارش‌ها
- `GET /api/admin/orders/:orderId` - جزئیات سفارش

### Reports Management (Admin)
- `GET /api/admin/reports` - لیست گزارش‌ها و شکایات
- `GET /api/admin/reports/:reportId` - جزئیات گزارش
- `PATCH /api/admin/reports/:reportId` - به‌روزرسانی وضعیت گزارش

### Admins Management (Super Admin Only)
- `GET /api/admin/admins` - لیست همه admins
- `POST /api/admin/admins` - ایجاد admin جدید
- `PATCH /api/admin/admins/:adminId` - ویرایش admin
- `PATCH /api/admin/admins/:adminId/password` - تغییر رمز admin
- `DELETE /api/admin/admins/:adminId` - حذف admin
