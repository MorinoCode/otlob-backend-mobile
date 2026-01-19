import * as orderModel from '../models/orderModel.js';

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    // اضافه کردن customer_note به لیست فیلدهای دریافتی از بدنه درخواست
    const { vendor_id, car_id, payment_method, items, pickup_time, customer_note } = req.body;

    if (!vendor_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newOrder = await orderModel.createOrderTransaction(userId, {
      vendor_id,
      car_id,
      payment_method,
      pickup_time,
      items,
      customer_note // پاس دادن یادداشت مشتری به مدل
    });

    // اطلاع‌رسانی آنی به فروشنده
    try {
      const io = req.app.get('socketio');
      if (io) {
        io.to(`vendor_${vendor_id}`).emit('new_order', {
          order: newOrder,
          message: 'New Order Received! 🍔'
        });
      }
    } catch (socketError) {
      console.log('Socket error (order created though):', socketError.message);
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Failed to place order', detail: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.getUserOrders(userId);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; 

    const validStatuses = ['PENDING', 'COOKING', 'READY', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedOrder = await orderModel.updateOrderStatusDb(orderId, status);

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // اطلاع‌رسانی آنی تغییر وضعیت به مشتری
    try {
      const io = req.app.get('socketio');
      if (io) {
        io.to(`order_${orderId}`).emit('order_status_updated', {
          status: updatedOrder.status,
          orderId: updatedOrder.id
        });
      }
    } catch (socketErr) {
      console.log('Status socket error:', socketErr.message);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// متد جدید برای دریافت جزئیات یک سفارش خاص (برای صفحه Tracking)
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};
export const rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const updatedOrder = await orderModel.rateOrderDb(orderId, rating);
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};
export const getOrderItemsList = async (req, res) => {
  try {
    const { orderId } = req.params;
    const items = await orderModel.getOrderItems(orderId);
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch items for re-order' });
  }
};