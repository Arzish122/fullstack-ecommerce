import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';


import '../styles/signup.css'; 

//web app's Firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyC1lki0z-0iKeKSIomsN9i7RymEMMJP324",
  authDomain: "e-commerce-112aa.firebaseapp.com",
  projectId: "e-commerce-112aa",
  storageBucket: "e-commerce-112aa.firebasestorage.app",
  messagingSenderId: "242828705120",
  appId: "1:242828705120:web:8564e7198cf0a1d154b205",
  measurementId: "G-F1434Y23KJ"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(''); // To display success or error messages
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setMessage(''); // Clear any previous messages

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      // Refresh the page
      window.location.reload(); // This will cause the page to reload and clear all fields
      return; // Stop if passwords don't match
    }

    try {
      // Attempt to create a new user with email and password using Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage('Registration successful! Redirecting to login...');
      // Redirect to the login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error("Signup error:", error.code, error.message);
      let errorMessage = "Registration failed."; // Generic error message

      // Provide more specific error messages based on Firebase error codes
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please login or use a different email.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. It must be at least 6 characters long.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/Password sign-in is not enabled in Firebase. Please enable it in your Firebase console.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      }
      setMessage(errorMessage);
    }
  };

  return (
    <div className="signup-container">
      <h2>Create Your Account</h2>
      {message && (
        // Display message with dynamic class for styling (success/error)
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password (min 6 characters)"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>
        <button type="submit" className="signup-button">
          Sign Up
        </button>
      </form>
      <p className="login-link">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Signup;
