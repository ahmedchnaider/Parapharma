import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { database } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SellerRevenueChart = ({ sellerName }) => {
  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    // Reference the specific seller's orders
    const sellerOrdersRef = ref(database, `sellerOrders/${sellerName}`);

    const unsubscribe = onValue(sellerOrdersRef, (snapshot) => {
      if (snapshot.exists()) {
        const orders = snapshot.val();
        const monthlyRevenue = {};

        // Iterate through each order ID
        Object.keys(orders).forEach(orderId => {
          // Check if it's an actual order (has properties we need)
          if (orderId.startsWith('ORD-')) {
            const orderData = orders[orderId];
            
            if (orderData.createdAt && orderData.subtotal) {
              const date = new Date(parseInt(orderData.createdAt));
              const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
              
              // Use subtotal instead of total
              monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + parseFloat(orderData.subtotal);
            }
          }
        });

        // Sort months chronologically
        const sortedMonths = Object.keys(monthlyRevenue).sort((a, b) => {
          return new Date(a) - new Date(b);
        });

        if (sortedMonths.length > 0) {
          setRevenueData({
            labels: sortedMonths,
            datasets: [
              {
                label: 'Monthly Revenue',
                data: sortedMonths.map(month => monthlyRevenue[month].toFixed(2)),
                fill: true,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#2196F3',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
              }
            ]
          });
        }
      }
    });

    return () => unsubscribe();
  }, [sellerName]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `Revenue: $${context.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value) => `$${value}`,
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div className="seller-revenue-chart">
      <h3>Revenue Over Time</h3>
      <div className="chart-container">
        {revenueData.labels.length > 0 ? (
          <Line data={revenueData} options={options} />
        ) : (
          <div className="no-data-message">No revenue data available</div>
        )}
      </div>
    </div>
  );
};

export default SellerRevenueChart; 