import dotenv from 'dotenv';
import http from 'http';
import os from 'os';
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

// ... (socket.io logic remains the same)
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join_vendor', (vendorId) => {
    const roomName = `vendor_${vendorId}`;
    socket.join(roomName);
    console.log(`✅ Vendor ${vendorId} joined room: ${roomName}`);
    console.log(`   Socket ID: ${socket.id}`);
    // Log all rooms this socket is in
    const rooms = Array.from(socket.rooms);
    console.log(`   All rooms for this socket:`, rooms);
  });

  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`User joined order room: order_${orderId}`);
  });

  socket.on('i_am_here', (data) => {
    const { vendorId, orderId, location, timestamp } = data;
    console.log(`\n🚗 ===== CUSTOMER ARRIVED =====`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Vendor ID: ${vendorId}`);
    console.log(`   Location: ${location?.latitude}, ${location?.longitude}`);
    console.log(`   Timestamp: ${timestamp}`);
    
    const roomName = `vendor_${vendorId}`;
    console.log(`   Sending to room: ${roomName}`);
    
    // Check if there are sockets in this room
    io.in(roomName).fetchSockets().then(sockets => {
      console.log(`   Sockets in room: ${sockets.length}`);
      
      const notificationData = {
        title: 'Customer Arrived! 🚗',
        body: `Customer is waiting for Order #${orderId.slice(0, 8)}`,
        orderId: orderId,
        location: location || null,
        timestamp: timestamp
      };
      
      console.log(`   Notification data:`, JSON.stringify(notificationData, null, 2));
      io.to(roomName).emit('customer_arrived', notificationData);
      console.log(`✅ Customer arrived notification sent\n`);
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


app.set('socketio', io);

const getLocalIpAddress = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '0.0.0.0'; // Fallback
};


const startServer = async () => {
  try {
    await query('SELECT NOW()');
    server.listen(PORT, '0.0.0.0', () => {
      const ip = getLocalIpAddress();
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log('   App is running on your local machine');
      console.log('   You can access it at:');
      console.log(`   - Local:   http://localhost:${PORT}`);
      console.log(`   - Network: http://${ip}:${PORT}\n`);
      console.log('✨ Use the "Network" address in your mobile app configuration. ✨');
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

startServer();