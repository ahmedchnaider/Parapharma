import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faChartLine, faShoppingCart, faUsers, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { database } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import './AnalyticsWidget.css';

const AnalyticsWidget = ({ onClose }) => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    uniqueCustomers: new Set(),
    averageOrderValue: 0,
    paymentMethods: {
      credit: 0,
      debit: 0,
      other: 0
    },
    orderStatus: {
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    }
  });

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const orders = snapshot.val();
        const stats = {
          totalRevenue: 0,
          totalOrders: 0,
          uniqueCustomers: new Set(),
          paymentMethods: {
            credit: 0,
            debit: 0,
            other: 0
          },
          orderStatus: {
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
          }
        };

        // Process each order
        Object.values(orders).forEach(order => {
          // Total Revenue
          stats.totalRevenue += order.total || 0;
          
          // Total Orders
          stats.totalOrders++;
          
          // Unique Customers
          if (order.userId) {
            stats.uniqueCustomers.add(order.userId);
          }
          
          // Payment Methods
          if (order.paymentMethod) {
            stats.paymentMethods[order.paymentMethod] = 
              (stats.paymentMethods[order.paymentMethod] || 0) + 1;
          }
          
          // Order Status
          if (order.status) {
            stats.orderStatus[order.status.toLowerCase()] = 
              (stats.orderStatus[order.status.toLowerCase()] || 0) + 1;
          }
        });

        // Calculate average order value
        const averageOrderValue = stats.totalOrders > 0 
          ? stats.totalRevenue / stats.totalOrders 
          : 0;

        setAnalytics({
          ...stats,
          averageOrderValue,
          uniqueCustomers: stats.uniqueCustomers.size
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="analytics-widget-overlay">
      <div className="analytics-widget">
        <div className="analytics-widget-header">
          <h2>Analytics Dashboard</h2>
          <button onClick={onClose} className="close-button">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="analytics-content">
          {/* Key Metrics Row */}
          <div className="metrics-row">
            <div className="metric-box">
              <div className="metric-icon">
                <FontAwesomeIcon icon={faDollarSign} className="icon green" />
              </div>
              <div className="metric-details">
                <span className="metric-label">Total Revenue</span>
                <span className="metric-value">${analytics.totalRevenue.toFixed(2)}</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon">
                <FontAwesomeIcon icon={faShoppingCart} className="icon blue" />
              </div>
              <div className="metric-details">
                <span className="metric-label">Total Orders</span>
                <span className="metric-value">{analytics.totalOrders}</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon">
                <FontAwesomeIcon icon={faUsers} className="icon purple" />
              </div>
              <div className="metric-details">
                <span className="metric-label">Unique Customers</span>
                <span className="metric-value">{analytics.uniqueCustomers}</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon">
                <FontAwesomeIcon icon={faChartLine} className="icon orange" />
              </div>
              <div className="metric-details">
                <span className="metric-label">Avg. Order Value</span>
                <span className="metric-value">${analytics.averageOrderValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status and Payment Methods */}
          <div className="info-grid">
            <div className="info-card">
              <h3>Order Status</h3>
              <div className="status-grid">
                <div className="status-row">
                  <div className="status-item">
                    <span>Processing</span>
                    <span className="status-value">{analytics.orderStatus.processing || 0}</span>
                  </div>
                  <div className="status-item">
                    <span>Shipped</span>
                    <span className="status-value">{analytics.orderStatus.shipped || 0}</span>
                  </div>
                </div>
                <div className="status-row">
                  <div className="status-item">
                    <span>Delivered</span>
                    <span className="status-value">{analytics.orderStatus.delivered || 0}</span>
                  </div>
                  <div className="status-item">
                    <span>Cancelled</span>
                    <span className="status-value">{analytics.orderStatus.cancelled || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Payment Methods</h3>
              <div className="payment-grid">
                <div className="payment-row">
                  <div className="payment-item">
                    <span>Credit</span>
                    <span className="payment-value">{analytics.paymentMethods.credit || 0} orders</span>
                  </div>
                  <div className="payment-item">
                    <span>Debit</span>
                    <span className="payment-value">{analytics.paymentMethods.debit || 0} orders</span>
                  </div>
                </div>
                <div className="payment-row">
                  <div className="payment-item">
                    <span>Other</span>
                    <span className="payment-value">{analytics.paymentMethods.other || 0} orders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWidget;
