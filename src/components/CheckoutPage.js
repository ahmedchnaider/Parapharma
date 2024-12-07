import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faLock, faTags, faTrash, faShieldAlt, faTruck, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import './CheckoutPage.css';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCheckout from './StripeCheckout';
import { ref, set, serverTimestamp } from 'firebase/database';
import { database } from '../firebaseConfig';

console.log('Stripe Key:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function CheckoutPage({ cart, setCart, cartTotal, user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handlePromoCodeChange = (e) => {
    setPromoCode(e.target.value);
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'PARA20%') {
      setDiscount(cartTotal * 0.2);
    } else {
      alert('Invalid promo code');
      setDiscount(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'credit') {
      setIsProcessing(true);
      try {
        const response = await fetch('http://localhost:5000/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Math.round(finalTotal * 100) })
        });
        const data = await response.json();
        const { clientSecret } = data;

        // Pass the clientSecret to StripeCheckout
        stripeCheckoutRef.current.processPayment(clientSecret, formData);
      } catch (error) {
        handlePaymentError("An error occurred while processing your payment.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Handle cash on delivery
      try {
        setIsProcessing(true);
        const orderId = generateOrderId();
        await saveOrderToFirebase(orderId, 'cod');
        await sendOrderToWebhook(orderId, formData.fullName, formData.email);
        setCart([]); // Clear cart
        navigate('/order-success', { 
          state: { 
            orderId, 
            email: formData.email 
          } 
        });
      } catch (error) {
        console.error('Error processing COD order:', error);
        handlePaymentError("An error occurred while processing your order.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const removeFromCart = (itemId) => {
    setCart(currentCart => currentCart.filter(item => item.id !== itemId));
  };

  const finalTotal = cartTotal - discount;

  const stripeCheckoutRef = React.useRef();

  const generateOrderId = () => {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const sendOrderToWebhook = async (orderId, fullName, email) => {
    try {
      const response = await fetch('https://hook.eu2.make.com/wvvra83eh4wis8cnfukpmrq3tf7biy9h', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, fullName, email }),
      });
      if (!response.ok) {
        throw new Error('Failed to send order data');
      }
    } catch (error) {
      console.error('Error sending order data:', error);
    }
  };

  const handlePaymentStart = () => {
    setIsProcessing(true);
    setPaymentError(null);
  };

  const handlePaymentSuccess = async () => {
    try {
      setIsProcessing(false);
      const orderId = generateOrderId();
      await saveOrderToFirebase(orderId, 'credit');
      await sendOrderToWebhook(orderId, formData.fullName, formData.email);
      setPaymentSuccess(true);
      setCart([]); // Clear cart
      navigate('/order-success', { 
        state: { 
          orderId, 
          email: formData.email 
        } 
      });
    } catch (error) {
      console.error('Error processing successful payment:', error);
      handlePaymentError("Payment successful but there was an error processing your order.");
    }
  };

  const handlePaymentError = (errorMessage) => {
    setIsProcessing(false);
    setPaymentError(errorMessage);
  };

  // Function to save order to Firebase
  const saveOrderToFirebase = async (orderId, paymentMethod) => {
    try {
      const orderData = {
        orderId,
        userId: user?.uid,
        customerDetails: {
          fullName: formData.fullName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sellerStore: item.sellerStore || 'Pharmashop ©',
          subtotal: item.price * item.quantity
        })),
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        subtotal: cartTotal,
        discount: discount,
        total: finalTotal,
        createdAt: serverTimestamp(),
        status: 'processing'
      };

      // Save to main orders collection
      await set(ref(database, `orders/${orderId}`), orderData);

      // Save to seller-specific orders
      const itemsBySeller = groupByStore(cart);
      for (const [sellerStore, items] of Object.entries(itemsBySeller)) {
        const sellerOrderData = {
          orderId,
          customerName: formData.fullName,
          customerEmail: formData.email,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
          })),
          subtotal: items.reduce((total, item) => total + (item.price * item.quantity), 0),
          createdAt: serverTimestamp(),
          status: 'processing',
          paymentMethod,
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
          shippingAddress: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          }
        };

        await set(ref(database, `sellerOrders/${sellerStore}/${orderId}`), sellerOrderData);
      }

    } catch (error) {
      console.error('Error saving order to Firebase:', error);
      throw error;
    }
  };

  return (
    <div className="checkout-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Cart
      </button>
      <h2>Checkout</h2>
      <div className="checkout-container">
        <form onSubmit={handleSubmit} className="checkout-form">
          <h3>Shipping Information</h3>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="zipCode">Zip Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="payment-method">
            <h3>Payment Method</h3>
            <div>
              <input 
                type="radio" 
                id="credit" 
                name="paymentMethod" 
                value="credit" 
                checked={paymentMethod === 'credit'}
                onChange={() => setPaymentMethod('credit')}
              />
              <label htmlFor="credit">
                <FontAwesomeIcon icon={faCreditCard} /> Credit Card
              </label>
            </div>
            <div>
              <input 
                type="radio" 
                id="cod" 
                name="paymentMethod" 
                value="cod" 
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              <label htmlFor="cod">
                <FontAwesomeIcon icon={faTruck} /> Cash on Delivery
              </label>
            </div>
          </div>
          {paymentMethod === 'credit' ? (
            <div className="payment-section">
              <h3>Secure Credit Card Payment</h3>
              <div className="card-element-container">
                <FontAwesomeIcon icon={faLock} className="lock-icon" />
                <Elements stripe={stripePromise}>
                  <StripeCheckout 
                    ref={stripeCheckoutRef}
                    amount={finalTotal} 
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </Elements>
              </div>
              <div className="security-badges">
                <FontAwesomeIcon icon={faShieldAlt} /> Secure 256-bit SSL encryption
              </div>
            </div>
          ) : (
            <div className="cod-message">
              <FontAwesomeIcon icon={faTruck} /> You will pay upon delivery.
            </div>
          )}
          <button type="submit" className="checkout-button" disabled={isProcessing}>
            <FontAwesomeIcon icon={faLock} /> 
            {isProcessing ? 'Processing...' : (paymentMethod === 'credit' ? 'Pay Now' : 'Place Order')}
          </button>
          {paymentError && <div className="error-message">{paymentError}</div>}
          {paymentSuccess && <div className="success-message">Payment successful!</div>}
        </form>
        <div className="order-summary">
          <h3>Order Summary</h3>
          {/* Group items by store */}
          {Object.entries(groupByStore(cart)).map(([storeName, items]) => (
            <div key={storeName} className="store-group">
              <h4 className="store-name">Sold by: {storeName}</h4>
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">${item.price.toFixed(2)} x {item.quantity}</span>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="remove-item-btn">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
            </div>
          ))}
          <div className="promo-code-section">
            <input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={handlePromoCodeChange}
            />
            <button onClick={applyPromoCode} className="apply-promo-btn">
              <FontAwesomeIcon icon={faTags} /> Apply
            </button>
          </div>
          <div className="cart-subtotal">
            <span>Subtotal:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="cart-discount">
              <span>Discount:</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="cart-total">
            <strong>Total:</strong>
            <strong>${finalTotal.toFixed(2)}</strong>
          </div>
          <div className="security-badges">
            <FontAwesomeIcon icon={faShieldAlt} /> Secure Checkout
            <div className="payment-logos">
              <img src="https://www.onlinecasinosreports.net/images/visa.jpg" alt="Visa" />
              <img src="https://www.mes-finances.be/wp-content/uploads/2020/07/MasterCard.png" alt="Mastercard" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to group cart items by store
const groupByStore = (cart) => {
  return cart.reduce((groups, item) => {
    const store = item.sellerStore || 'Unknown Store';
    if (!groups[store]) {
      groups[store] = [];
    }
    groups[store].push(item);
    return groups;
  }, {});
};

export default CheckoutPage;
