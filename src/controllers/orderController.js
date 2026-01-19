import * as orderModel from '../models/orderModel.js';

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vendor_id, car_id, payment_method, items, pickup_time } = req.body;

    if (!vendor_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newOrder = await orderModel.createOrderTransaction(userId, {
      vendor_id,
      car_id,
      payment_method,
      pickup_time,
      items
    });

    const io = req.app.get('socketio');
    io.to(`vendor_${vendor_id}`).emit('new_order', {
      order: newOrder,
      message: 'New Order Received! 🍔'
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to place order' });
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

    const io = req.app.get('socketio');
    io.to(`order_${orderId}`).emit('order_status_updated', {
      status: updatedOrder.status,
      orderId: updatedOrder.id
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};