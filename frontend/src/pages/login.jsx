import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

import '../styles/login.css'; // Make sure this CSS file exists

// web app's Firebase configuration 
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setMessage(''); 

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      let errorMessage = "Login failed. Please check your credentials."; 

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      }

      setMessage(errorMessage);
      // ❌ Removed page reload so message stays visible
    }
  };

  return (
    <div className="login-container">
      <h2>Login to Your Account</h2>
      {message && (
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleLogin}>
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
            placeholder="Enter your password"
            required
          />
        </div>
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
      <p className="signup-link">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default Login;
