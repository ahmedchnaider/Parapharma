import React, { useState } from 'react';
import { database } from '../firebaseConfig';
import { ref, push, serverTimestamp } from 'firebase/database';
import { z } from 'zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faTimes } from '@fortawesome/free-solid-svg-icons';
import './AddProductForm.css';

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().url("Image URL must be a valid URL"),
  description: z.string().min(1, "Description is required"),
  sellerStore: z.string().min(1, "Seller store name is required"),
});

// Define categories
const categories = ['Skincare', 'Vitamins', 'Moisturizer', 'Shampoo'];

const AddProductForm = ({ onClose }) => {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    category: '',
    imageUrl: '',
    description: '',
    sellerStore: 'Pharmashop ©',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const validatedProduct = productSchema.parse({
        ...product,
        price: parseFloat(product.price),
      });

      const marketplaceRef = ref(database, 'marketplace');
      await push(marketplaceRef, {
        ...validatedProduct,
        createdAt: serverTimestamp(),
      });
      alert('Product added successfully to the marketplace!');
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      } else {
        console.error('Error adding product to marketplace:', error);
        setError('An error occurred while adding the product to the marketplace.');
      }
    }
  };

  return (
    <div className="add-product-overlay">
      <div className="add-product-modal">
        <button className="close-modal" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h2>Add New Product to Marketplace</h2>
        <div className="form-preview-container">
          <form onSubmit={handleSubmit} className="product-form">
            <div className="input-group">
              <label htmlFor="name">Product Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                type="number"
                name="price"
                value={product.price}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={product.category}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="imageUrl">Image URL</label>
              <input
                id="imageUrl"
                type="url"
                name="imageUrl"
                value={product.imageUrl}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={product.description}
                onChange={handleChange}
                required
                rows="5"
              />
            </div>
            <div className="input-group">
              <label htmlFor="sellerStore">Seller Store</label>
              <input
                id="sellerStore"
                type="text"
                name="sellerStore"
                value={product.sellerStore}
                readOnly
                disabled
              />
            </div>
            {error && <p className="error">{error}</p>}
            <div className="button-group">
              <button type="submit" className="submit-btn">Add Product</button>
              <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            </div>
          </form>
          <div className="product-preview">
            <div className="product-card">
              <div className="product-image-container">
                <img src={product.imageUrl || 'https://via.placeholder.com/300'} alt={product.name} className="product-image" />
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name || 'Product Name'}</h3>
                <p className="product-category">{product.category || 'Category'}</p>
                <p className="product-seller">{product.sellerStore}</p>
                <div className="product-rating">
                  {[...Array(5)].map((_, i) => (
                    <FontAwesomeIcon key={i} icon={faStar} className="star-icon" />
                  ))}
                  <span className="rating-count">(0)</span>
                </div>
                <p className="product-price">${product.price || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductForm;
