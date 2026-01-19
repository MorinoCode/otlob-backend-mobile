import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { query } from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join_vendor', (vendorId) => {
    socket.join(`vendor_${vendorId}`);
    console.log(`Vendor ${vendorId} joined room: vendor_${vendorId}`);
  });

  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`User joined order room: order_${orderId}`);
  });

  socket.on('i_am_here', (data) => {
    const { vendorId, orderId } = data;
    console.log(`🚗 Customer arrived for Order #${orderId}`);

    io.to(`vendor_${vendorId}`).emit('customer_arrived', {
      title: 'Customer Arrived! 🚗',
      body: `Customer is waiting for Order #${orderId}`,
      orderId: orderId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.set('socketio', io);

const startServer = async () => {
  try {
    await query('SELECT NOW()');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

startServer();