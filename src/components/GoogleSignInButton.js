import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, database } from '../firebaseConfig';
import { ref, set, get } from 'firebase/database';

function GoogleSignInButton({ setUser, toggleLoginWidget }) {
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      const credential = GoogleAuthProvider.credential(codeResponse.access_token);
      signInWithPopup(auth, googleProvider)
        .then((result) => {
          const user = result.user;
          console.log('Google Sign-In Successful', user);
          
          // Check if user already exists in the database
          const userRef = ref(database, `users/${user.uid}`);
          get(userRef).then((snapshot) => {
            if (!snapshot.exists()) {
              // If user doesn't exist, add them to the database
              set(userRef, {
                name: user.displayName,
                email: user.email,
                createdAt: new Date().toISOString(),
                provider: 'google'
              }).then(() => {
                console.log('User added to database');
              }).catch((error) => {
                console.error('Error adding user to database:', error);
              });
            }
          }).catch((error) => {
            console.error('Error checking user in database:', error);
          });

          setUser(user);
          toggleLoginWidget();
        })
        .catch((error) => {
          console.error('Google Sign-In Error', error);
        });
    },
    onError: (error) => console.error('Login Failed:', error)
  });

  return (
    <button onClick={() => login()} className="google-sign-in-button">
      Sign in with Google
    </button>
  );
}

export default GoogleSignInButton;
