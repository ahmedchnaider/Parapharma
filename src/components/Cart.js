import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

function Cart({ cart, removeFromCart, closeCart, addToCart, user, toggleLoginWidget }) {
  const navigate = useNavigate();
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const handleCheckout = () => {
    if (user) {
      // Proceed with checkout
      console.log('Proceeding to checkout');
    } else {
      // Open login panel
      toggleLoginWidget('Please log in to proceed with checkout.');
      closeCart(); // Close the cart when opening the login panel
    }
  };

  return (
    <div className="cart-dropdown">
      <div className="cart-header">
        <h3>Your Cart</h3>
        <button onClick={closeCart} className="close-cart">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty</p>
      ) : (
        <>
          <ul className="cart-items">
            {cart.map((item) => (
              <li key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <p className="cart-item-price">${item.price.toFixed(2)}</p>
                  <p className="cart-item-store">Sold by: {item.sellerStore || 'Unknown Store'}</p>
                  <div className="cart-item-quantity">
                    <button onClick={() => removeFromCart(item.id)} className="quantity-btn">
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="quantity-btn">
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>
                <button onClick={() => {
                  for (let i = 0; i < item.quantity; i++) {
                    removeFromCart(item.id);
                  }
                }} className="remove-item">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-footer">
            <div className="cart-total">
              <strong>Total:</strong> ${cartTotal.toFixed(2)}
            </div>
            <button 
              className="checkout-button" 
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
