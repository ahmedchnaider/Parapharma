import React, { useState, useEffect } from 'react';
import { database } from '../firebaseConfig';
import { ref, onValue, remove, update } from 'firebase/database';

function UsersInterface({ onClose }) {
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showSellers, setShowSellers] = useState(false);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const sellersRef = ref(database, 'sellers');

    onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      const usersList = usersData ? Object.entries(usersData).map(([id, data]) => ({ id, ...data })) : [];
      setUsers(usersList);
    });

    onValue(sellersRef, (snapshot) => {
      const sellersData = snapshot.val();
      const sellersList = sellersData ? Object.entries(sellersData).map(([id, data]) => ({ id, ...data })) : [];
      setSellers(sellersList);
    });
  }, []);

  const handleEdit = (user, isSeller) => {
    setEditingUser({ ...user, isSeller });
  };

  const handleSave = () => {
    const path = editingUser.isSeller ? 'sellers' : 'users';
    const userRef = ref(database, `${path}/${editingUser.id}`);
    update(userRef, {
      name: editingUser.name,
      email: editingUser.email,
    }).then(() => {
      setEditingUser(null);
    }).catch((error) => {
      console.error("Error updating user: ", error);
    });
  };

  const handleDelete = (userId, isSeller) => {
    const path = isSeller ? 'sellers' : 'users';
    const userRef = ref(database, `${path}/${userId}`);
    remove(userRef).then(() => {
      console.log("User deleted successfully");
    }).catch((error) => {
      console.error("Error deleting user: ", error);
    });
  };

  const handleApprove = (sellerId) => {
    const sellerRef = ref(database, `sellers/${sellerId}`);
    update(sellerRef, { approved: true }).then(() => {
      console.log("Seller approved successfully");
    }).catch((error) => {
      console.error("Error approving seller: ", error);
    });
  };

  const toggleUserType = () => {
    setShowSellers(!showSellers);
  };

  return (
    <div className="users-interface-overlay">
      <div className="users-interface">
        <div className="users-interface-header">
          <h2>User Management</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="toggle-container">
          <span className={`toggle-label ${!showSellers ? 'active' : ''}`}>Clients</span>
          <div className="toggle-switch" onClick={toggleUserType}>
            <div className={`toggle-slider ${showSellers ? 'active' : ''}`}></div>
          </div>
          <span className={`toggle-label ${showSellers ? 'active' : ''}`}>Sellers</span>
        </div>

        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              {showSellers && <th>Status</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(showSellers ? sellers : users).map(user => (
              <tr key={user.id}>
                <td>
                  {editingUser && editingUser.id === user.id ? 
                    <input 
                      value={editingUser.name} 
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    /> : user.name}
                </td>
                <td>
                  {editingUser && editingUser.id === user.id ? 
                    <input 
                      value={editingUser.email} 
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    /> : user.email}
                </td>
                {showSellers && <td>{user.approved ? 'Approved' : 'Pending'}</td>}
                <td>
                  <div className="button-group">
                    {editingUser && editingUser.id === user.id ? (
                      <>
                        <button className="action-button save-button" onClick={handleSave}>Save</button>
                        <button className="action-button cancel-button" onClick={() => setEditingUser(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="action-button edit-button" onClick={() => handleEdit(user, showSellers)}>Edit</button>
                        <button className="action-button delete-button" onClick={() => handleDelete(user.id, showSellers)}>Delete</button>
                        {showSellers && !user.approved && (
                          <button className="action-button approve-button" onClick={() => handleApprove(user.id)}>Approve</button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersInterface;
