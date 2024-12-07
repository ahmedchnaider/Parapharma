import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { database, auth } from '../firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendar, faEnvelope, faSignOutAlt, faTimes, faKey } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

const UserProfile = ({ user, onClose, onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user && user.uid) {
        try {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setUserData(snapshot.val());
          } else {
            console.log('User data not found in database');
            // If user data is not in the database, use the auth user object
            setUserData({
              name: user.displayName || 'User',
              email: user.email,
              createdAt: user.metadata.creationTime,
              provider: user.providerData[0].providerId
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    try {
      // Reauthenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Change the password
      await updatePassword(auth.currentUser, newPassword);
      alert('Password updated successfully');
      setNewPassword('');
      setCurrentPassword('');
      setIsChangingPassword(false);
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        alert('Current password is incorrect. Please try again.');
      } else {
        alert('Failed to update password. Please try again.');
      }
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <div 
      className="user-profile-widget"
      style={{
        position: 'fixed',
        top: '110px',
        left: '70%',
        transform: 'translateX(-50%)',
        zIndex: 1002,
      }}
    >
      <div className="user-profile-header">
        <div className="user-avatar">
          {userData.provider === 'google.com' ? (
            <FontAwesomeIcon icon={faGoogle} />
          ) : (
            <FontAwesomeIcon icon={faUser} />
          )}
        </div>
        <h2>{userData.name || 'User'}</h2>
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div className="user-profile-info">
        <div className="info-item">
          <FontAwesomeIcon icon={faEnvelope} />
          <span>{userData.email}</span>
        </div>
        <div className="info-item">
          <FontAwesomeIcon icon={faCalendar} />
          <span>Joined: {new Date(userData.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      {userData.provider !== 'google.com' && (
        <>
          {isChangingPassword ? (
            <div className="change-password-section">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button onClick={handleChangePassword}>Update Password</button>
              <button onClick={() => setIsChangingPassword(false)}>Cancel</button>
            </div>
          ) : (
            <button className="change-password-button" onClick={() => setIsChangingPassword(true)}>
              <FontAwesomeIcon icon={faKey} /> Change Password
            </button>
          )}
        </>
      )}
      <button className="logout-button" onClick={onLogout}>
        <FontAwesomeIcon icon={faSignOutAlt} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default UserProfile;
