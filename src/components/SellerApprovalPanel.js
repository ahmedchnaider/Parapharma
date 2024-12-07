import React, { useState, useEffect } from 'react';
import { database } from '../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faUserCog } from '@fortawesome/free-solid-svg-icons';
import './SellerApprovalPanel.css'; // Make sure to create this CSS file

function SellerApprovalPanel({ isOpen, onClose }) {
  const [pendingSellers, setPendingSellers] = useState([]);

  useEffect(() => {
    const sellersRef = ref(database, 'sellers');
    const unsubscribe = onValue(sellersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pendingList = Object.entries(data)
          .filter(([_, seller]) => !seller.approved && !seller.rejected)
          .map(([id, seller]) => ({ id, ...seller }));
        setPendingSellers(pendingList);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (sellerId) => {
    try {
      await update(ref(database, `sellers/${sellerId}`), { approved: true });
      alert('Seller approved successfully!');
    } catch (error) {
      console.error('Error approving seller:', error);
      alert('Failed to approve seller. Please try again.');
    }
  };

  const handleReject = async (sellerId) => {
    try {
      await update(ref(database, `sellers/${sellerId}`), { rejected: true });
      alert('Seller rejected successfully!');
    } catch (error) {
      console.error('Error rejecting seller:', error);
      alert('Failed to reject seller. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="seller-approval-overlay">
      <div className="seller-approval-widget">
        <div className="seller-approval-header">
          <h2>
            <FontAwesomeIcon icon={faUserCog} /> Seller Approvals
          </h2>
          <button 
            className="close-button" 
            onClick={onClose} 
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {pendingSellers.length === 0 ? (
          <p className="no-pending">No pending seller applications.</p>
        ) : (
          <div className="seller-list">
            {pendingSellers.map((seller) => (
              <div key={seller.id} className="seller-item">
                <div className="seller-info">
                  <h3>{seller.businessName}</h3>
                  <p><strong>Email:</strong> {seller.email}</p>
                  <p><strong>Phone:</strong> {seller.phoneNumber}</p>
                  <p><strong>Address:</strong> {seller.address}</p>
                  <p><strong>Description:</strong> {seller.description}</p>
                </div>
                <div className="action-buttons">
                  <button onClick={() => handleApprove(seller.id)} className="approve-button">
                    <FontAwesomeIcon icon={faCheck} /> Approve
                  </button>
                  <button onClick={() => handleReject(seller.id)} className="reject-button">
                    <FontAwesomeIcon icon={faTimes} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerApprovalPanel;
