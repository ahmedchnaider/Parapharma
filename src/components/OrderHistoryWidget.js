import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBox, faCheck, faClock, faTruck } from '@fortawesome/free-solid-svg-icons';
import { database } from '../firebaseConfig';
import { ref, onValue, get } from 'firebase/database';
import './OrderHistoryWidget.css';

const STATUS_CLASSES = {
  'pending': 'status-pending',
  'processing': 'status-processing',
  'shipped': 'status-shipped',
  'delivered': 'status-delivered',
  'cancelled': 'status-cancelled',
  'being prepared': 'status-pending'
};

function OrderHistoryWidget({ user, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      
      // Reference to user's orders
      const ordersRef = ref(database, 'orders');
      
      const unsubscribe = onValue(ordersRef, async (snapshot) => {
        if (snapshot.exists()) {
          const ordersData = snapshot.val();
          const userOrders = [];
          
          // Filter orders for current user and get their current status
          for (const [orderId, order] of Object.entries(ordersData)) {
            if (order.userId === user.uid) {
              try {
                // Get the current status from sellerOrders using the correct path
                const sellerOrderRef = ref(database, `sellerOrders/${order.sellerStore}/${order.orderId}`);
                const sellerOrderSnapshot = await get(sellerOrderRef);
                
                console.log('Seller Order Status:', sellerOrderSnapshot.val()?.status); // Debug log
                console.log('Original Order Status:', order.status); // Debug log
                
                const currentStatus = sellerOrderSnapshot.exists() && sellerOrderSnapshot.val()?.status 
                  ? sellerOrderSnapshot.val().status 
                  : order.status;

                console.log('Final Status:', currentStatus); // Debug log

                userOrders.push({
                  ...order,
                  orderId: order.orderId || orderId,
                  status: currentStatus // Make sure this status is being used
                });
              } catch (error) {
                console.error('Error fetching order status:', error);
                // If there's an error, use the original status
                userOrders.push({
                  ...order,
                  orderId: order.orderId || orderId
                });
              }
            }
          }
          
          // Sort orders by date (newest first)
          const sortedOrders = userOrders.sort((a, b) => b.createdAt - a.createdAt);
          console.log('Sorted Orders:', sortedOrders); // Debug log
          setOrders(sortedOrders);
          setFilteredOrders(sortedOrders);
        } else {
          setOrders([]);
          setFilteredOrders([]);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setSearchOrderId(searchTerm);
    
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'processing':
        return <FontAwesomeIcon icon={faClock} className="status-icon processing" />;
      case 'shipped':
        return <FontAwesomeIcon icon={faTruck} className="status-icon shipped" />;
      case 'delivered':
        return <FontAwesomeIcon icon={faCheck} className="status-icon delivered" />;
      case 'cancelled':
        return <FontAwesomeIcon icon={faTimes} className="status-icon cancelled" />;
      case 'pending':
        return <FontAwesomeIcon icon={faClock} className="status-icon pending" />;
      case 'being prepared':
        return <FontAwesomeIcon icon={faClock} className="status-icon processing" />;
      default:
        return <FontAwesomeIcon icon={faBox} className="status-icon" />;
    }
  };

  const getStatusDisplay = (status) => {
    const normalizedStatus = status?.toLowerCase();
    
    if (normalizedStatus?.includes('being prepared')) {
      return {
        text: 'Being Prepared',
        className: STATUS_CLASSES['being prepared']
      };
    }
    
    const statusMapping = {
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'pending': 'Pending'
    };

    return {
      text: statusMapping[normalizedStatus] || status,
      className: STATUS_CLASSES[normalizedStatus] || 'status-default'
    };
  };

  return (
    <div className="order-history-widget">
      <div className="widget-header">
        <h2>Order History</h2>
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by Order ID"
          value={searchOrderId}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="orders-container">
        {loading ? (
          <div className="loading">Loading your orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="no-orders">No orders found</div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.orderId} className="order-card">
              <div className="order-header">
                <div className="order-id">Order #{order.orderId}</div>
                <div className="order-date">
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="order-status">
                {getStatusIcon(order.status)}
                <span className={`status-badge ${getStatusDisplay(order.status).className}`}>
                  {getStatusDisplay(order.status).text}
                </span>
              </div>

              <div className="order-details">
                <div className="items-summary">
                  {order.items.map((item, index) => (
                    <div key={index} className="item-brief">
                      {item.name} x {item.quantity}
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  Total: ${order.total.toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrderHistoryWidget; 