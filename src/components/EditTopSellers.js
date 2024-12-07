import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faStar } from '@fortawesome/free-solid-svg-icons';
import { database } from '../firebaseConfig';
import { ref, set } from 'firebase/database';

function EditTopSellers({ allProducts, currentTopSellers, onClose, onSave }) {
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    setSelectedProducts(currentTopSellers.slice(0, 2));
  }, [currentTopSellers]);

  const handleProductToggle = (product) => {
    setSelectedProducts((prev) => {
      if (prev.find((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      } else if (prev.length < 2) {
        return [...prev, product];
      }
      return prev;
    });
  };

  const handleSave = async () => {
    const topSellersRef = ref(database, 'topSellers');
    const topSellersObject = selectedProducts.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});

    try {
      await set(topSellersRef, topSellersObject);
      onSave(selectedProducts);
      alert('Top sellers updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating top sellers:', error);
      alert('Failed to update top sellers. Please try again.');
    }
  };

  return (
    <div className="edit-top-sellers-container">
      <h2>Edit Top Sellers</h2>
      <div className="edit-top-sellers-grid">
        {selectedProducts.map((product, index) => (
          <div key={product.id} className="edit-top-seller-item">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            <button onClick={() => handleProductToggle(product)} className="remove-button">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ))}
        {[...Array(2 - selectedProducts.length)].map((_, index) => (
          <div key={`empty-${index}`} className="edit-top-seller-item empty">
            <p>Select a product</p>
          </div>
        ))}
      </div>
      <div className="product-selection">
        <h3>Available Products</h3>
        <div className="product-grid">
          {allProducts.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} />
              <h4>{product.name}</h4>
              <p>${product.price}</p>
              <button 
                onClick={() => handleProductToggle(product)}
                disabled={selectedProducts.length >= 2 && !selectedProducts.find(p => p.id === product.id)}
                className={selectedProducts.find(p => p.id === product.id) ? 'remove-button' : 'add-button'}
              >
                {selectedProducts.find(p => p.id === product.id) ? 'Remove' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="edit-top-sellers-actions">
        <button onClick={handleSave} className="save-button">Save Changes</button>
        <button onClick={onClose} className="cancel-button">Cancel</button>
      </div>
    </div>
  );
}

export default EditTopSellers;
