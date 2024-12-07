import { database } from '../firebaseConfig';
import { ref, get } from 'firebase/database';

export const getSellerAnalytics = async (storeName) => {
  try {
    console.log('Fetching analytics for store:', storeName);
    
    // Get store orders
    const ordersRef = ref(database, `sellerOrders/${storeName}`);
    const ordersSnapshot = await get(ordersRef);
    
    // Initialize analytics object
    const analytics = {
      // Sales Overview
      totalOrders: 0,
      totalRevenue: 0,
      
      // Time-based Analysis
      dailySales: {},
      weeklySales: {},
      
      // Order Status
      ordersByStatus: {
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      },
      
      // Payment Methods
      paymentMethods: {
        credit: 0,
        debit: 0,
        other: 0
      }
    };

    if (ordersSnapshot.exists()) {
      ordersSnapshot.forEach((orderSnapshot) => {
        const order = orderSnapshot.val();
        
        // Increment total orders
        analytics.totalOrders++;
        
        // Add to total revenue
        analytics.totalRevenue += parseFloat(order.subtotal || 0);
        
        // Track order status
        if (order.status) {
          analytics.ordersByStatus[order.status] = 
            (analytics.ordersByStatus[order.status] || 0) + 1;
        }
        
        // Track payment methods
        if (order.paymentMethod) {
          analytics.paymentMethods[order.paymentMethod] = 
            (analytics.paymentMethods[order.paymentMethod] || 0) + 1;
        }
        
        // Add to daily sales
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        analytics.dailySales[orderDate] = 
          (analytics.dailySales[orderDate] || 0) + parseFloat(order.subtotal || 0);
      });
    }
    
    console.log('Processed analytics:', analytics);
    return analytics;
    
  } catch (error) {
    console.error('Error fetching seller analytics:', error);
    throw error;
  }
}; 