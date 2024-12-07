import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faEdit, faFire } from '@fortawesome/free-solid-svg-icons';

const TopSellers = ({ topProducts, isAdmin, onEditClick }) => {
  // Limit the number of displayed products to 2
  const displayedProducts = topProducts.slice(0, 2);

  return (
    <section className="top-sellers">
      <img 
        src="https://pharma-shop.tn/themes/pharmashop/assets/img/modules/appagebuilder/images/routine.webp" 
        alt="Hot Deals" 
        className="top-sellers-image"
      />
      <div className="top-sellers-content">
        <div className="top-sellers-content-header">
          <h2>HOT DEALS</h2>
          {isAdmin && (
            <FontAwesomeIcon
              icon={faEdit}
              className="edit-top-sellers-icon"
              onClick={onEditClick}
              title="Edit Hot Deals"
            />
          )}
        </div>
        <div className="top-sellers-grid">
          {displayedProducts.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id} className="top-seller-card">
              <div className="hot-deal-icon">
                <FontAwesomeIcon icon={faFire} />
              </div>
              <img src={product.image} alt={product.name} className="top-seller-image" />
              <div className="top-seller-info">
                <h3>{product.name}</h3>
                <div className="product-rating">
                  {[...Array(5)].map((_, index) => (
                    <FontAwesomeIcon
                      key={index}
                      icon={faStar}
                      className={`star-icon ${index < product.rating ? 'filled' : ''}`}
                    />
                  ))}
                </div>
                <p className="top-seller-price">${product.price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopSellers;
