import React from 'react';
import { Link } from 'react-router-dom';
import './CategorySection.css';

function CategorySection({ products }) {
  const categories = ['Skin Care', 'Moisturizer', 'Vitamins'];
  
  // Category images and info
  const categoryInfo = {
    'Skin Care': {
      image: 'https://plus.unsplash.com/premium_photo-1682096423780-41ca1b04af68?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'Advanced skincare solutions'
    },
    'Moisturizer': {
      image: 'https://images.unsplash.com/photo-1583334529937-bc4761d2cdad?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'Hydrating care solutions'
    },
    'Vitamins': {
      image: 'https://plus.unsplash.com/premium_photo-1664373622147-d610c247a11b?q=80&w=1897&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'Essential supplements'
    }
  };

  return (
    <div className="category-section">
      <h2>Shop by Categories</h2>
      
      {categories.map((category) => (
        <div key={category} className="category-row">
          <div className="category-header">
            <div className="category-banner">
              <img 
                src={categoryInfo[category].image} 
                alt={category} 
                className="category-image"
              />
              <div className="category-text">
                <h3>{category}</h3>
                <p>{categoryInfo[category].description}</p>
              </div>
            </div>
          </div>
          
          <div className="category-products">
            {products
              .filter(product => product.category === category)
              .slice(0, 3)
              .map(product => (
                <Link 
                  to={`/product/${product.id}`} 
                  key={product.id} 
                  className="product-card"
                  style={{ textDecoration: 'none' }}
                >
                  <img src={product.imageUrl} alt={product.name} />
                  <h4>{product.name}</h4>
                  <p className="price">${product.price}</p>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CategorySection; 