import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingCart, faFire, faLeaf, faTrophy, faClock, faHeart, faBolt, faFilter } from '@fortawesome/free-solid-svg-icons';
import './MarketplaceList.css';

function MarketplaceList({ items, addToCart, user }) {
  const cardRefs = useRef([]);
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 1000
  });
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [tempPriceRange, setTempPriceRange] = useState({
    min: 0,
    max: 1000
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    cardRefs.current.forEach((card) => {
      if (card) {
        observer.observe(card);
      }
    });

    return () => {
      cardRefs.current.forEach((card) => {
        if (card) {
          observer.unobserve(card);
        }
      });
    };
  }, [items]);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        className={index < Math.floor(rating) ? "star filled" : "star"}
      />
    ));
  };

  const iconOptions = [
    { icon: faFire, label: 'Hot Deal', color: '#ff4136' },
    { icon: faLeaf, label: 'Natural', color: '#2ecc40' },
    { icon: faTrophy, label: 'Best Seller', color: '#ffdc00' },
    { icon: faClock, label: 'Limited Time', color: '#0074d9' },
    { icon: faHeart, label: 'Customer Favorite', color: '#ff851b' },
    { icon: faBolt, label: 'New Arrival', color: '#b10dc9' }
  ];

  const assignIcons = (items) => {
    return items.map(item => {
      const numIcons = Math.floor(Math.random() * 3); // 0, 1, or 2 icons
      const shuffledIcons = [...iconOptions].sort(() => Math.random() - 0.5);
      const itemIcons = shuffledIcons.slice(0, numIcons);

      return {
        ...item,
        icons: itemIcons
      };
    });
  };

  const itemsWithIcons = useMemo(() => assignIcons(items), [items]);

  const filteredItems = useMemo(() => {
    // Reset all cards visibility first
    cardRefs.current.forEach(card => {
      if (card) {
        card.style.display = 'flex'; // Reset display to default
        card.classList.remove('visible');
      }
    });

    const filtered = itemsWithIcons.filter(item => 
      item.price >= priceRange.min && 
      item.price <= priceRange.max
    );

    // After filtering, ensure only filtered items are visible
    setTimeout(() => {
      cardRefs.current.forEach((card, index) => {
        if (card) {
          const shouldShow = filtered.some(item => item.id === itemsWithIcons[index].id);
          if (!shouldShow) {
            card.style.display = 'none';
          } else {
            card.classList.add('visible');
          }
        }
      });
    }, 0);

    return filtered;
  }, [itemsWithIcons, priceRange]);

  const handlePriceChange = (type, value) => {
    setTempPriceRange(prev => ({
      ...prev,
      [type]: Number(value)
    }));
  };

  const applyPriceFilter = () => {
    setPriceRange(tempPriceRange);
  };

  return (
    <div className="marketplace-container">
      <div className="filter-buttons">
        <button 
          className={`filter-btn ${showPriceFilter ? 'active' : ''}`}
          onClick={() => setShowPriceFilter(!showPriceFilter)}
        >
          <FontAwesomeIcon icon={faFilter} /> Price Filter
        </button>
      </div>

      {showPriceFilter && (
        <div className="price-range-container">
          <div className="price-inputs">
            <div className="price-input-group">
              <input
                type="number"
                min="0"
                placeholder="Min Price"
                value={tempPriceRange.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
              />
            </div>
            <span className="price-separator">-</span>
            <div className="price-input-group">
              <input
                type="number"
                min="0"
                placeholder="Max Price"
                value={tempPriceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
              />
            </div>
            <button 
              className="apply-filter-btn"
              onClick={applyPriceFilter}
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}

      <div className="marketplace-grid">
        {itemsWithIcons.map((item, index) => (
          <Link
            to={`/product/${item.id}`}
            key={item.id}
            className="marketplace-card"
            ref={(el) => (cardRefs.current[index] = el)}
            style={{ display: 'flex' }} // Set initial display
          >
            <div className="marketplace-card-image">
              <img src={item.imageUrl} alt={item.name} />
              <div className="marketplace-card-icons">
                {item.icons.map((iconInfo, iconIndex) => (
                  <span 
                    key={iconIndex} 
                    className="marketplace-card-icon" 
                    title={iconInfo.label}
                    style={{ backgroundColor: iconInfo.color }}
                  >
                    <FontAwesomeIcon icon={iconInfo.icon} />
                  </span>
                ))}
              </div>
            </div>
            <div className="marketplace-card-content">
              <h3 className="marketplace-card-title">{item.name}</h3>
              <p className="marketplace-card-category">{item.category}</p>
              <div className="marketplace-card-rating">{renderStars(item.rating)}</div>
              <p className="marketplace-card-price">${item.price.toFixed(2)}</p>
              <button 
                className="quick-add-btn"
                onClick={(e) => {
                  e.preventDefault();
                  addToCart(item);
                }}
                disabled={!user}
                title={user ? "Add to Cart" : "Please log in to add to cart"}
              >
                {user ? "Add to Cart" : "Log in to Add"}
              </button>
              <p className="marketplace-card-seller">Sold by: {item.sellerStore}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default MarketplaceList;
