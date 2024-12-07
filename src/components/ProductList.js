import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import './ProductList.css';

const ProductList = ({ products, addToCart }) => {
  // Limit the number of products to a maximum of 3
  const displayedProducts = products.slice(0, 3);

  const ProductCard = ({ product }) => (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image">
        <img 
          src={product.image} 
          alt={product.name} 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = 'path/to/default-image.jpg';
          }}
        />
      </div>
      <div className="product-details">
        <h3>{product.name}</h3>
        <div className="star-rating">
          {[...Array(5)].map((_, index) => (
            <FontAwesomeIcon key={index} icon={faStar} className="star-icon" />
          ))}
        </div>
        <p className="product-price">${product.price}</p>
        <button 
          className="add-to-cart-btn" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product);
          }}
        >
          Add to Cart
        </button>
      </div>
    </Link>
  );

  return (
    <div className="product-list">
      {displayedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
