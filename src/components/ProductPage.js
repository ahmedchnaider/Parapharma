import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { database } from '../firebaseConfig';
import { ref, get } from 'firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faStar, faPlus, faMinus, faHeart, faUser, faCheckCircle, faUserMd, faBoxOpen, faTruck, faSmile, faShieldAlt, faLeaf, faBolt, faSun, faWater, faMoon, faAppleAlt, faBone, faBrain, faWind, faSnowflake, faGem, faMagic, faArrowLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './ProductPage.css';

const categoryBenefits = {
  'Skin Care': [
    { icon: faSun, text: 'UV Protection' },
    { icon: faWater, text: 'Hydrating' },
    { icon: faGem, text: 'Anti-Aging' }
  ],
  'Moisturizer': [
    { icon: faWater, text: 'Deep Hydration' },
    { icon: faLeaf, text: 'Natural Ingredients' },
    { icon: faMoon, text: 'Day & Night Use' }
  ],
  'Vitamins': [
    { icon: faShieldAlt, text: 'Immune Support' },
    { icon: faAppleAlt, text: 'Nutrient Rich' },
    { icon: faBone, text: 'Bone Health' }
  ],
  'Shampoo': [
    { icon: faMagic, text: 'Adds Shine' },
    { icon: faWind, text: 'Reduces Frizz' },
    { icon: faSnowflake, text: 'Scalp Care' }
  ]
};

function ProductPage({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const navigate = useNavigate();
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  const allReviews = [
    { 
      id: 1, 
      user: "Sarah Johnson", 
      rating: 5, 
      comment: "This vitamin C supplement has significantly boosted my immune system. I've noticed fewer colds and more energy throughout the day. Highly recommend for anyone looking to improve their overall health!", 
      date: "2023-05-15",
      verifiedPurchase: true
    },
    { 
      id: 2, 
      user: "Michael Chen", 
      rating: 4, 
      comment: "I've been using this probiotic for a month now, and I've seen a noticeable improvement in my digestive health. It's gentle on the stomach and easy to take. The only reason I'm not giving 5 stars is the slightly high price point.", 
      date: "2023-05-10",
      verifiedPurchase: true
    },
    { 
      id: 3, 
      user: "Emma Rodriguez", 
      rating: 5, 
      comment: "As someone with joint pain, this glucosamine and chondroitin supplement has been a game-changer. I've experienced reduced discomfort and increased mobility. It's become an essential part of my daily health routine!", 
      date: "2023-05-05",
      verifiedPurchase: true
    },
    {
      id: 4,
      user: "David Thompson",
      rating: 4.5,
      comment: "I'm impressed with the quality of this multivitamin. It's comprehensive and I've noticed an improvement in my overall energy levels. The capsules are easy to swallow too.",
      date: "2023-05-20",
      verifiedPurchase: true
    },
    {
      id: 5,
      user: "Lisa Patel",
      rating: 5,
      comment: "This omega-3 supplement is fantastic! No fishy aftertaste and I've seen improvements in my skin and hair health. Will definitely repurchase.",
      date: "2023-05-25",
      verifiedPurchase: true
    },
    {
      id: 6,
      user: "John Smith",
      rating: 4,
      comment: "The magnesium supplement has helped with my sleep quality. I fall asleep faster and wake up feeling more refreshed. Just wish the pills were a bit smaller.",
      date: "2023-05-30",
      verifiedPurchase: true
    },
    {
      id: 7,
      user: "Anna Kowalski",
      rating: 5,
      comment: "I've tried many collagen supplements, but this one takes the cake. My skin looks more radiant and my nails are stronger. Highly recommended!",
      date: "2023-06-05",
      verifiedPurchase: true
    },
    {
      id: 8,
      user: "Robert Lee",
      rating: 4.5,
      comment: "This vitamin D supplement has made a noticeable difference in my mood, especially during the winter months. It's become a staple in my daily routine.",
      date: "2023-06-10",
      verifiedPurchase: true
    },
    {
      id: 9,
      user: "Sophie Dubois",
      rating: 4,
      comment: "I've been taking this iron supplement for a month now. My energy levels have improved and I'm not feeling as fatigued. The taste is neutral, which is a plus.",
      date: "2023-06-15",
      verifiedPurchase: true
    },
    {
      id: 10,
      user: "Carlos Gomez",
      rating: 5,
      comment: "This protein powder is excellent! It mixes well, tastes great, and has helped me recover faster after workouts. Will be buying again!",
      date: "2023-06-20",
      verifiedPurchase: true
    }
  ];

  useEffect(() => {
    const fetchProduct = async () => {
      const productRef = ref(database, `marketplace/${id}`);
      try {
        const snapshot = await get(productRef);
        if (snapshot.exists()) {
          const productData = { id, ...snapshot.val() };
          setProduct(productData);
          fetchSimilarProducts(productData.category);
        } else {
          console.log("No such product!");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const fetchSimilarProducts = async (category) => {
    const marketplaceRef = ref(database, 'marketplace');
    try {
      const snapshot = await get(marketplaceRef);
      if (snapshot.exists()) {
        const allProducts = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value
        }));
        const filteredProducts = allProducts
          .filter(item => item.category === category && item.id !== id)
          .sort(() => 0.5 - Math.random()) // Shuffle the array
          .slice(0, 4); // Get up to 4 similar products
        setSimilarProducts(filteredProducts);
      }
    } catch (error) {
      console.error("Error fetching similar products:", error);
    }
  };

  const handleQuantityChange = (change) => {
    setQuantity(prevQuantity => Math.max(1, prevQuantity + change));
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      const marketplaceRef = ref(database, 'marketplace');
      try {
        const snapshot = await get(marketplaceRef);
        if (snapshot.exists()) {
          const allProducts = Object.entries(snapshot.val()).map(([key, value]) => ({
            id: key,
            ...value
          }));
          const filteredProducts = allProducts
            .filter(item => item.id !== id)
            .sort(() => 0.5 - Math.random()) // Shuffle the array
            .slice(0, 4); // Get 4 random products
          setRecommendedProducts(filteredProducts);
        }
      } catch (error) {
        console.error("Error fetching recommended products:", error);
      }
    };

    fetchRecommendedProducts();
  }, [id]);

  // Randomly select 3 reviews
  const getRandomReviews = () => {
    const shuffled = allReviews.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  useEffect(() => {
    setReviews(getRandomReviews());
  }, [id]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="review-stars" aria-label={`${rating} out of 5 stars`}>
        {[...Array(fullStars)].map((_, i) => (
          <FontAwesomeIcon key={i} icon={faStar} className="star-icon full" aria-hidden="true" />
        ))}
        {hasHalfStar && <FontAwesomeIcon icon={faStar} className="star-icon half" aria-hidden="true" />}
      </div>
    );
  };

  const renderBenefits = () => {
    const benefits = categoryBenefits[product.category] || [];
    return (
      <div className="product-benefits-container">
        <h3 className="benefits-title">Benefits:</h3>
        <div className="product-benefits">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-item">
              <FontAwesomeIcon icon={benefit.icon} className="benefit-icon" />
              <span className="benefit-text">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleReturn = () => {
    navigate(-1); // This will take the user back to the previous page
  };

  const suggestProduct = async () => {
    if (product && product.category) {
      const marketplaceRef = ref(database, 'marketplace');
      try {
        const snapshot = await get(marketplaceRef);
        if (snapshot.exists()) {
          const allProducts = Object.entries(snapshot.val()).map(([key, value]) => ({
            id: key,
            ...value
          }));
          const sameCategory = allProducts.filter(item => 
            item.category === product.category && item.id !== product.id
          );
          if (sameCategory.length > 0) {
            const randomProduct = sameCategory[Math.floor(Math.random() * sameCategory.length)];
            navigate(`/product/${randomProduct.id}`);
          }
        }
      } catch (error) {
        console.error("Error suggesting product:", error);
      }
    }
  };

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      if (product && product.category) {
        const marketplaceRef = ref(database, 'marketplace');
        try {
          const snapshot = await get(marketplaceRef);
          if (snapshot.exists()) {
            const allProducts = Object.entries(snapshot.val()).map(([key, value]) => ({
              id: key,
              ...value
            }));
            const sameCategory = allProducts.filter(item => item.category === product.category);
            setCategoryProducts(sameCategory);
            setCurrentProductIndex(sameCategory.findIndex(item => item.id === product.id));
          }
        } catch (error) {
          console.error("Error fetching category products:", error);
        }
      }
    };

    fetchCategoryProducts();
  }, [product]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'ArrowLeft') {
        navigateProduct(-1);
      } else if (event.key === 'ArrowRight') {
        navigateProduct(1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentProductIndex, categoryProducts]);

  const navigateProduct = (direction) => {
    const newIndex = (currentProductIndex + direction + categoryProducts.length) % categoryProducts.length;
    const newProduct = categoryProducts[newIndex];
    if (newProduct) {
      navigate(`/product/${newProduct.id}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!product) {
    return <div className="product-not-found">Product not found</div>;
  }

  const originalPrice = product.price;
  const discountedPrice = originalPrice * 0.8; // 20% off

  return (
    <div className="product-page">
      <div className="product-left">
        <button className="return-button" onClick={() => navigateProduct(-1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <img src={product.imageUrl} alt={product.name} className="product-image" />
      </div>
      <div className="product-right">
        <div className="product-title-container">
          <h1 className="product-title">{product.name}</h1>
          <button className={`favorite-btn ${isFavorite ? 'active' : ''}`} onClick={toggleFavorite}>
            <FontAwesomeIcon icon={faHeart} />
          </button>
        </div>
        <div className="product-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <FontAwesomeIcon key={star} icon={faStar} className="star-icon" />
          ))}
        </div>
        <p className="product-description">{product.description}</p>
        <div className="product-price-container">
          <p className="product-price">${discountedPrice.toFixed(2)}</p>
          <p className="product-original-price">${originalPrice.toFixed(2)}</p>
          <span className="product-discount">SAVE 20%</span>
        </div>
        <div className="quantity-selector">
          <span className="quantity-label">Quantity:</span>
          <button onClick={() => handleQuantityChange(-1)}><FontAwesomeIcon icon={faMinus} /></button>
          <span>{quantity}</span>
          <button onClick={() => handleQuantityChange(1)}><FontAwesomeIcon icon={faPlus} /></button>
        </div>
        
        {renderBenefits()}

        <button className="add-to-cart-btn" onClick={() => addToCart({...product, quantity})}>
          <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
        </button>
        <p className="product-seller">Sold by: {product.sellerStore}</p>
        
        <button className="suggest-button" onClick={() => navigateProduct(1)}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      <div className="similar-products-section">
        <div className="similar-products-header">
          <h2>Similar Products</h2>
          <div className="fading-line"></div>
        </div>
        <div className="similar-products-list">
          {similarProducts.map(similarProduct => (
            <Link to={`/product/${similarProduct.id}`} key={similarProduct.id} className="similar-product-item">
              <img src={similarProduct.imageUrl} alt={similarProduct.name} className="similar-product-image" />
              <h3 className="similar-product-name">{similarProduct.name}</h3>
              <p className="similar-product-price">${similarProduct.price.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </div>

      <section className="reviews-section" aria-labelledby="reviews-heading">
        <div className="reviews-header">
          <h2 id="reviews-heading">Customer Reviews</h2>
          <div className="fading-line" aria-hidden="true"></div>
        </div>
        <div className="reviews-list">
          {reviews.map(review => (
            <article key={review.id} className="review-card">
              <header className="review-header">
                <FontAwesomeIcon icon={faUser} className="user-icon" aria-hidden="true" />
                <span className="review-user">{review.user}</span>
                {review.verifiedPurchase && <span className="verified-purchase">Verified Purchase</span>}
                <time className="review-date" dateTime={review.date}>{review.date}</time>
              </header>
              <div className="review-rating">
                {renderStars(review.rating)}
                <span className="review-rating-number">{review.rating.toFixed(1)}</span>
              </div>
              <p className="review-comment">{review.comment}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="why-choose-us" aria-labelledby="why-choose-us-heading">
        <h2 id="why-choose-us-heading">Why Choose Us</h2>
        <div className="why-choose-us-content">
          <div className="why-choose-us-item">
            <FontAwesomeIcon icon={faCheckCircle} className="why-choose-us-icon" />
            <h3>Quality Assurance</h3>
            <p>Highest quality supplements from reputable manufacturers.</p>
          </div>
          <div className="why-choose-us-item">
            <FontAwesomeIcon icon={faUserMd} className="why-choose-us-icon" />
            <h3>Expert Guidance</h3>
            <p>Qualified pharmacists available for personalized advice.</p>
          </div>
          <div className="why-choose-us-item">
            <FontAwesomeIcon icon={faBoxOpen} className="why-choose-us-icon" />
            <h3>Wide Selection</h3>
            <p>Comprehensive range for all your wellness needs.</p>
          </div>
        </div>
        <div className="why-choose-us-content-center">
          <div className="why-choose-us-item">
            <FontAwesomeIcon icon={faTruck} className="why-choose-us-icon" />
            <h3>Fast & Reliable Shipping</h3>
            <p>Quick, secure delivery on all orders.</p>
          </div>
          <div className="why-choose-us-item">
            <FontAwesomeIcon icon={faSmile} className="why-choose-us-icon" />
            <h3>Customer Satisfaction</h3>
            <p>30-day money-back guarantee and responsive service.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProductPage;
