import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebaseConfig';
import { ref, set, get } from 'firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faFileAlt, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import './SellerRegistration.css'; // Make sure to create this CSS file

function SellerRegistration({ user }) {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkSellerStatus();
    }
  }, [user]);

  const checkSellerStatus = async () => {
    if (user) {
      const sellerRef = ref(database, `sellers/${user.uid}`);
      const snapshot = await get(sellerRef);
      if (snapshot.exists()) {
        setHasApplied(true);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to register as a seller.');
      return;
    }

    try {
      await set(ref(database, `sellers/${user.uid}`), {
        businessName,
        description,
        phoneNumber,
        address,
        email: user.email,
        approved: false, // Sellers need to be approved by an admin
        appliedAt: new Date().toISOString(),
      });
      alert('Your seller registration has been submitted for approval.');
      navigate('/'); // Redirect to home page after submission
    } catch (error) {
      console.error('Error registering seller:', error);
      alert('An error occurred while registering. Please try again.');
    }
  };

  return (
    <div className="seller-registration-container">
      <div className="seller-registration-content">
        <h2 className="seller-registration-title">
          <FontAwesomeIcon icon={faStore} /> Become a Seller
        </h2>
        {!user && (
          <p className="seller-registration-message">Please log in to register as a seller.</p>
        )}
        {hasApplied && (
          <div className="seller-registration-message">
            <h3>Application Status</h3>
            <p>You have already submitted a seller application. Please wait for admin approval.</p>
            <button className="seller-registration-button" onClick={() => navigate('/')}>Return to Home</button>
          </div>
        )}
        {user && !hasApplied && (
          <form onSubmit={handleSubmit} className="seller-registration-form">
            <div className="form-group">
              <label htmlFor="businessName">
                <FontAwesomeIcon icon={faStore} /> Business Name
              </label>
              <input
                type="text"
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                placeholder="Enter your business name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">
                <FontAwesomeIcon icon={faFileAlt} /> Business Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe your business"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">
                <FontAwesomeIcon icon={faPhone} /> Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="Enter your phone number"
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">
                <FontAwesomeIcon icon={faMapMarkerAlt} /> Business Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Enter your business address"
              />
            </div>
            <button type="submit" className="seller-registration-button">Submit Application</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SellerRegistration;
