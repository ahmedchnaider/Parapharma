import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './OrderSuccessPage.css';

function OrderSuccessPage() {
  const location = useLocation();
  const { orderId, email } = location.state || {};

  return (
    <div className="order-success-page">
      <div className="success-container">
        <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
        <h1>Order Successful!</h1>
        <p>Thank you for your purchase.</p>
        <p>Your order ID is: <strong>{orderId}</strong></p>
        <p>An email has been sent to <strong>{email}</strong> with your order details and tracking information.</p>
        <p>You can use this order ID to track your order status.</p>
        <Link to="/" className="home-button">Go Home</Link>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
