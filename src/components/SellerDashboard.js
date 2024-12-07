import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlus, faStar, faStore, faChevronLeft, faChevronRight, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { database, auth } from '../firebaseConfig';
import { ref, push, serverTimestamp, get, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import './SellerDashboard.css';
import { getSellerAnalytics } from '../services/sellerAnalyticsService';
import SellerRevenueChart from './SellerRevenueChart';

const calculateTotalRevenue = (products) => {
  return products
    .reduce((total, product) => total + (parseFloat(product.price) || 0), 0)
    .toFixed(2);
};

const calculateAveragePrice = (products) => {
  if (products.length === 0) return "0.00";
  const total = products.reduce((sum, product) => sum + (parseFloat(product.price) || 0), 0);
  return (total / products.length).toFixed(2);
};

function SellerDashboard() {
  const navigate = useNavigate();
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    imageUrl: '',
    category: ''
  });
  const [storeInfo, setStoreInfo] = useState({
    businessName: '',
    address: '',
    phone: '',
    email: ''
  });
  const [storeProducts, setStoreProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);

  const categories = ['Skin Care', 'Shampoo', 'Moisturizer', 'Vitamins'];

  useEffect(() => {
    const fetchSellerInfo = async () => {
      const user = auth.currentUser;
      if (user) {
        const sellersRef = ref(database, 'sellers');
        const sellerQuery = query(sellersRef, orderByChild('email'), equalTo(user.email));
        const snapshot = await get(sellerQuery);
        if (snapshot.exists()) {
          const sellerData = Object.values(snapshot.val())[0];
          console.log('Seller data:', sellerData);
          setStoreInfo({
            businessName: sellerData.businessName || '',
            address: sellerData.address || '',
            phone: sellerData.phoneNumber || '',
            email: sellerData.email || ''
          });
        }
      }
    };

    fetchSellerInfo();
  }, []);

  useEffect(() => {
    const fetchStoreProducts = async () => {
      if (storeInfo.businessName) {
        const marketplaceRef = ref(database, 'marketplace');
        const storeQuery = query(marketplaceRef, orderByChild('sellerStore'), equalTo(storeInfo.businessName));
        const snapshot = await get(storeQuery);
        if (snapshot.exists()) {
          const products = Object.values(snapshot.val());
          setStoreProducts(products);
        }
      }
    };

    fetchStoreProducts();
  }, [storeInfo.businessName]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (storeInfo.businessName) {
        try {
          setIsLoading(true);
          const analyticsData = await getSellerAnalytics(storeInfo.businessName);
          setAnalytics(analyticsData);
        } catch (error) {
          console.error('Error fetching analytics:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAnalytics();
  }, [storeInfo.businessName]);

  useEffect(() => {
    const fetchSellerOrders = async () => {
      if (storeInfo.businessName) {
        try {
          const sellerOrdersRef = ref(database, 'sellerOrders/' + storeInfo.businessName);
          const snapshot = await get(sellerOrdersRef);
          
          if (snapshot.exists()) {
            const ordersData = Object.entries(snapshot.val()).map(([orderId, orderData]) => ({
              orderId,
              ...orderData
            }));
            
            // Sort orders by creation date (newest first)
            ordersData.sort((a, b) => b.createdAt - a.createdAt);
            setSellerOrders(ordersData);
          }
        } catch (error) {
          console.error('Error fetching seller orders:', error);
        }
      }
    };

    fetchSellerOrders();
  }, [storeInfo.businessName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newProduct.name || !newProduct.price || !newProduct.imageUrl || !newProduct.category) {
      alert("Please fill in all fields");
      return;
    }

    // Ensure price is a valid number
    const price = parseFloat(newProduct.price);
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price");
      return;
    }

    try {
      const marketplaceRef = ref(database, 'marketplace');
      const productToAdd = {
        ...newProduct,
        price: price,
        createdAt: serverTimestamp(),
        sellerStore: storeInfo.businessName
      };

      await push(marketplaceRef, productToAdd);
      console.log("Product added successfully");
      setNewProduct({ name: '', price: '', imageUrl: '', category: '' });
    } catch (error) {
      console.error("Error adding product: ", error);
      alert("An error occurred while adding the product. Please try again.");
    }
  };

  const nextSlide = () => {
    setCurrentSlide(prev => 
      prev + 1 >= Math.ceil(storeProducts.length / 4) ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide(prev => 
      prev - 1 < 0 ? Math.ceil(storeProducts.length / 4) - 1 : prev - 1
    );
  };

  const handleEditClick = (product) => {
    setEditingProduct({
      ...product,
      price: parseFloat(product.price)
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (productName) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Get reference to marketplace
        const marketplaceRef = ref(database, 'marketplace');
        
        // Query to find the product by name and seller store
        const productQuery = query(
          marketplaceRef, 
          orderByChild('name'), 
          equalTo(productName)
        );
        
        // Get the product data
        const snapshot = await get(productQuery);
        
        if (snapshot.exists()) {
          // Get the product key
          const productKey = Object.keys(snapshot.val())[0];
          
          // Delete the product
          await remove(ref(database, `marketplace/${productKey}`));
          
          // Update local state
          setStoreProducts(prevProducts => 
            prevProducts.filter(product => product.name !== productName)
          );
          
          console.log("Product deleted successfully");
        }
      } catch (error) {
        console.error("Error deleting product: ", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get reference to marketplace
      const marketplaceRef = ref(database, 'marketplace');
      
      // Query to find the product by both name and sellerStore
      const productQuery = query(
        marketplaceRef, 
        orderByChild('sellerStore'), 
        equalTo(storeInfo.businessName)
      );
      
      // Get the product data
      const snapshot = await get(productQuery);
      
      if (snapshot.exists()) {
        // Find the product with matching name in the results
        const products = snapshot.val();
        const productKey = Object.keys(products).find(
          key => products[key].name === editingProduct.name
        );
        
        if (productKey) {
          // Update the product
          await update(ref(database, `marketplace/${productKey}`), {
            ...editingProduct,
            price: parseFloat(editingProduct.price),
            updatedAt: serverTimestamp(),
            sellerStore: storeInfo.businessName // Ensure sellerStore is preserved
          });
          
          // Update local state
          setStoreProducts(prevProducts =>
            prevProducts.map(product =>
              product.name === editingProduct.name ? {
                ...editingProduct,
                sellerStore: storeInfo.businessName
              } : product
            )
          );
          
          setIsEditModalOpen(false);
          console.log("Product updated successfully");
        } else {
          throw new Error("Product not found");
        }
      }
    } catch (error) {
      console.error("Error updating product: ", error);
      alert("Failed to update product. Please try again.");
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      // 1. Update in sellerOrders collection
      const sellerOrderRef = ref(database, `sellerOrders/${storeInfo.businessName}/${orderId}`);
      await update(sellerOrderRef, {
        status: newStatus
      });

      // 2. Update in main orders collection
      const ordersRef = ref(database, `orders/${orderId}`);
      await update(ordersRef, {
        status: newStatus
      });
      
      // 3. Update local state
      setSellerOrders(prevOrders =>
        prevOrders.map(order =>
          order.orderId === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );

      console.log(`Status updated to ${newStatus} for order ${orderId} in both collections`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const OrderItemsModal = ({ order, onClose }) => {
    return (
      <div className="edit-modal-overlay">
        <div className="edit-modal">
          <h3>Order Items - {order.orderId}</h3>
          <div className="order-items-list">
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <img src={item.imageUrl} alt={item.name} className="item-image" />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: ${item.price}</p>
                  <p>Subtotal: ${(item.quantity * item.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="modal-buttons">
            <button onClick={onClose} className="cancel-button">Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="seller-dashboard">
      <button className="back-button" onClick={() => navigate('/')}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Store
      </button>
      <h2>Seller Dashboard - {storeInfo.businessName}</h2>
      
      <section className="store-info-section">
        <h3><FontAwesomeIcon icon={faStore} /> Store Information</h3>
        <div className="store-info-container">
          <p><strong>Business Name:</strong> {storeInfo.businessName}</p>
          <p><strong>Address</strong> {storeInfo.address}</p>
          <p><strong>Phone</strong> {storeInfo.phone}</p>
          <p><strong>Email</strong> {storeInfo.email}</p>
        </div>
      </section>

      <section className="analytics-section">
        <h3>
          <span className="live-indicator">
            <span className="pulse"></span>
            Store Analytics
          </span>
        </h3>
        
        {isLoading ? (
          <div className="loading-spinner">Loading analytics...</div>
        ) : (
          <>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Total Revenue</h4>
                <p>${analytics?.totalRevenue.toFixed(2) || '0.00'}</p>
              </div>
              <div className="analytics-card">
                <h4>Total Orders</h4>
                <p>{analytics?.totalOrders || 0}</p>
              </div>
              <div className="analytics-card">
                <h4>Average Order Value</h4>
                <p>
                  ${analytics?.totalOrders 
                    ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2) 
                    : '0.00'}
                </p>
              </div>
              <div className="analytics-card">
                <h4>Payment Methods</h4>
                <div className="payment-methods-breakdown">
                  {Object.entries(analytics?.paymentMethods || {}).map(([method, count]) => (
                    <div key={method} className="payment-method-item">
                      <span>{method}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <SellerRevenueChart sellerName={storeInfo.businessName} />

      <section className="orders-section">
        <h3>
          <span className="live-indicator">
            <span className="pulse"></span>
            Order History
          </span>
        </h3>
        
        <div className="orders-container">
          {sellerOrders.length > 0 ? (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment Method</th>
                  <th>Subtotal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sellerOrders.map((order) => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div>{order.customerName}</div>
                      <div className="customer-email">{order.customerEmail}</div>
                    </td>
                    <td>
                      <button 
                        className="view-items-btn"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsItemsModalOpen(true);
                        }}
                      >
                        View Items
                      </button>
                    </td>
                    <td>{order.paymentMethod}</td>
                    <td>${order.subtotal}</td>
                    <td>
                      <select
                        className={`status-select ${order.status.toLowerCase()}`}
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.orderId,e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-orders">
              <p>No orders found</p>
            </div>
          )}
        </div>
      </section>

      <section className="store-products-section">
        <h3>
          <span className="live-indicator">
            <span className="pulse"></span>
            Live Products
          </span> 
        </h3>
        <div className="products-carousel-container">
          <button 
            className="carousel-button prev" 
            onClick={prevSlide}
            disabled={storeProducts.length <= 4}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          
          <div className="products-carousel">
            <div 
              className="carousel-track" 
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {storeProducts.map((product, index) => (
                <div key={index} className="carousel-product-card">
                  <div className="product-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEditClick(product)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteClick(product.name)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                  <img src={product.imageUrl} alt={product.name} />
                  <div className="carousel-product-info">
                    <h4>{product.name}</h4>
                    <p className="carousel-product-category">{product.category}</p>
                    <p className="carousel-product-price">${product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className="carousel-button next" 
            onClick={nextSlide}
            disabled={storeProducts.length <= 4}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </section>

      <section className="add-product-section">
        <h3>Add New Product to Marketplace</h3>
        <div className="add-product-container">
          <div className="form-container">
            <form onSubmit={handleAddProduct}>
              <input
                type="text"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                placeholder="Product Name"
                required
              />
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleInputChange}
                placeholder="Price"
                step="0.01"
                min="0"
                required
              />
              <textarea
                name="description"
                value={newProduct.description}
                onChange={handleInputChange}
                placeholder="Description"
                required
              />
              <input
                type="url"
                name="imageUrl"
                value={newProduct.imageUrl}
                onChange={handleInputChange}
                placeholder="Image URL"
                required
              />
              <select
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
              <button type="submit">
                <FontAwesomeIcon icon={faPlus} /> Add to Marketplace
              </button>
            </form>
          </div>
          
          <div className="preview-container">
            <div className="product-card-preview">
            
              <div className="product-card">
                {newProduct.imageUrl && (
                  <img src={newProduct.imageUrl} alt={newProduct.name || 'Product preview'} />
                )}
                <div className="product-info">
                  <h3>{newProduct.name || 'Product Name'}</h3>
                  <p className="product-category">{newProduct.category || 'Category'}</p>
                  <div className="product-rating">
                    {[...Array(5)].map((_, i) => (
                      <FontAwesomeIcon key={i} icon={faStar} className="star-icon" />
                    ))}
                  </div>
                  <p className="product-price">${newProduct.price || '0.00'}</p>
                  <button className="add-to-cart-btn">Add to Cart</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isEditModalOpen && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <h3>Edit Product</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                name="name"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  name: e.target.value
                })}
                placeholder="Product Name"
                required
              />
              <input
                type="number"
                name="price"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  price: parseFloat(e.target.value)
                })}
                placeholder="Price"
                step="0.01"
                min="0"
                required
              />
              <textarea
                name="description"
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  description: e.target.value
                })}
                placeholder="Description"
                required
              />
              <input
                type="url"
                name="imageUrl"
                value={editingProduct.imageUrl}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  imageUrl: e.target.value
                })}
                placeholder="Image URL"
                required
              />
              <select
                name="category"
                value={editingProduct.category}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  category: e.target.value
                })}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
              <div className="modal-buttons">
                <button type="submit">Save Changes</button>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isItemsModalOpen && selectedOrder && (
        <OrderItemsModal
          order={selectedOrder}
          onClose={() => {
            setIsItemsModalOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}

export default SellerDashboard;
