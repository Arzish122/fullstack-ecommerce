// Details.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import firebaseApp from './firebase';

import '../styles/details.css';

const Modal = ({ message, onClose }) => (
  <div className="modal-overlay">
    <div className="modal">
      <p>{message}</p>
      <button onClick={onClose} className="modal-ok-btn">OK</button>
    </div>
  </div>
);

const Details = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const auth = getAuth(firebaseApp);
  const unsubscribe = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [mainImageSrc, setMainImageSrc] = useState(null);

  // -----------------------------
  // Search state (local filter like Product.jsx)
  // -----------------------------
  const [allProducts, setAllProducts] = useState([]);
  const [currentProducts, setCurrentProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all products for local search
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/products");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setAllProducts(data);
        setCurrentProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };
    fetchProducts();
  }, []);

  // Handle search input
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (p) => {
    setSearchQuery(p.title);
    setShowSuggestions(false);
    navigate(`/product-details/${p.id}`);
  };

  const filteredSuggestions = currentProducts
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  const handleShowModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:5000/product/${id}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data);
        if (data.image) {
          setMainImageSrc(`data:image/jpeg;base64,${data.image}`);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();

    return () => {
      if (unsubscribe.current) unsubscribe.current();
    };
  }, [id]);

  useEffect(() => {
    unsubscribe.current = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // navigate('/login');
      }
    });
  }, [auth, navigate]);

  const renderStars = (starCount) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <img
          key={i}
          src="/imgs/star.png"
          alt="star"
          className={i > starCount ? 'empty-star' : ''}
        />
      );
    }
    return stars;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const user = auth.currentUser;
    if (!user) {
      const confirmLogin = window.confirm(
        "You must be logged in to add items to your cart.\nDo you want to log in now?"
      );
      if (confirmLogin) {
        navigate('/login');
      }
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          quantity: quantity
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add to cart');
      navigate('/cart');
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Failed to add product to cart.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (type) => {
    setQuantity((prev) => {
      if (type === 'increase') return prev + 1;
      if (type === 'decrease') return Math.max(1, prev - 1);
      return prev;
    });
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;
  if (!product) return <div className="not-found-container">Product not found.</div>;

  return (
    <>
      {showModal && <Modal message={modalMessage} onClose={handleCloseModal} />}

      {/* HEADER with search */}
      <header id="header">
        <div className="head-container">
          <div className="logo-div">
            <Link to="/" className="brand-logo">
              <img src="/imgs/logo-colored.svg" alt="logo" />
            </Link>
          </div>
          <div className="search-bar" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => {
                if (filteredSuggestions.length > 0) setShowSuggestions(true);
              }}
            />
            <button className="search-btn">Search</button>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                className="search-suggestions"
                style={{
                  position: 'absolute',
                  top: '48px',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #eee',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  zIndex: 999,
                  borderRadius: 6,
                  maxHeight: 320,
                  overflowY: 'auto'
                }}
              >
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {filteredSuggestions.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => handleSuggestionClick(p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f1f1'
                      }}
                    >
                      <div style={{ width: 48, height: 48, marginRight: 12 }}>
                        <img
                          src={`data:image/jpeg;base64,${p.image}`}
                          alt={p.title}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
                          onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/placeholder.png'; }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>${Number(p.current_price || 0).toFixed(2)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="menu-div">
            <div className="menu-opt">
              <Link to="/login">
                <img src="/imgs/account vector.png" alt="user" />
                <span>Profile</span>
              </Link>
            </div>
            <div className="menu-opt">
              <a href="#">
                <img src="/imgs/conversation vector.png" alt="Message" />
                <span>Message</span>
              </a>
            </div>
            <div className="menu-opt">
              <a href="#">
                <img src="/imgs/heart vector.png" alt="heart" />
                <span>Orders</span>
              </a>
            </div>
            <div className="menu-opt">
              <Link to="/cart">
                <img src="/imgs/cart vector.png" alt="cart" />
                <span>My Cart</span>
              </Link>
            </div>
          </div>
        </div>

        <nav className="navbar">
          <div className="nav-links">
            <Link to="/">
              <img src="/imgs/menu.png" alt="menu" style={{ marginRight: '5px' }} />
              <span>All Categories</span>
            </Link>
            <Link to="/">Hot Offers</Link>
            <Link to="/">Gift Boxes</Link>
            <Link to="/">Projects</Link>
            <Link to="/">Menu Items</Link>
            <Link to="/">
              <span>Help</span>
              <img src="/imgs/expand_less.png" alt="dropdown" style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>
          <div className="dropdown">
            <div className="lang-dropdown">
              <a href="#">
                <span>English, USD</span>
                <img src="/imgs/expand_less.png" alt="dropdown" style={{ transform: 'rotate(180deg)' }} />
              </a>
            </div>
            <div className="ship-dropdown">
              <a href="#">
                <span>Ship to </span>
                <img src="/imgs/icon.png" alt="flag" style={{ marginLeft: '10px' }} />
                <img src="/imgs/expand_less.png" alt="dropdown" style={{ transform: 'rotate(180deg)' }} />
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main className="details-page main-content">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &gt; <Link to="/product">Products</Link> &gt; <span>{product.title}</span>
        </div>

        <div className="product-main">
          {/* Left column: images */}
          <div className="product-images">
            <div className="main-image">
              <img id="main-product-image" src={mainImageSrc || '/imgs/3185113.jpg'} alt={product.title} />
            </div>
            <div className="thumbnail-images">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="thumbnail">
                  <img
                    src={mainImageSrc || '/imgs/3185113.jpg'}
                    alt={`thumb-${i}`}
                    onClick={() => setMainImageSrc(mainImageSrc || `data:image/jpeg;base64,${product.image}`)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Center column: info */}
          <div className="product-info">
            <h1>{product.title}</h1>
            <div className="rating-section">
              <div className="stars">{renderStars(product.star_count)}</div>
              <span id="rating-value">{product.rating}</span>
              <span id="review-count">({product.orders} orders)</span>
            </div>
            <div className="price-section">
              <span className="current-price">${product.current_price}</span>
              {product.old_price && <span className="old-price">{product.old_price}</span>}
            </div>
            <div className="quantity-section">
              <label className="option-label">Quantity:</label>
              <div className="quantity-controls">
                <button className="quantity-btn" onClick={() => handleQuantityChange('decrease')}>-</button>
                <input className="quantity-input" type="text" value={quantity} readOnly />
                <button className="quantity-btn" onClick={() => handleQuantityChange('increase')}>+</button>
              </div>
            </div>
            <div className="action-buttons">
              <button className="btn-primary" onClick={handleAddToCart}>
                <i className="fas fa-shopping-cart"></i> Add to cart
              </button>
              <button className="btn-secondary">Send inquiry</button>
              <button className="btn-icon"><i className="fas fa-heart"></i></button>
            </div>
            <div className="product-features">
              <div className="feature"><i className="fas fa-shield-alt" style={{ color: '#28a745' }}></i><span>Security policy (trusted by customers)</span></div>
              <div className="feature"><i className="fas fa-truck" style={{ color: '#0D6EFD' }}></i><span>Delivery policy (free worldwide shipping)</span></div>
              <div className="feature"><i className="fas fa-undo" style={{ color: '#FF9017' }}></i><span>Return policy (easy returns within 30 days)</span></div>
            </div>
          </div>

          {/* Right column: seller */}
          <div className="seller-info">
            <div className="seller-header">
              <div className="seller-avatar">G</div>
              <div className="seller-details">
                <h3>Garmin Trading LLC</h3>
                <div className="seller-rating">★★★★☆ 4.3</div>
              </div>
            </div>
            <div className="seller-stats">
              <div className="stat">
                <div className="stat-value">4.3</div>
                <div className="stat-label">Supplier rating</div>
              </div>
              <div className="stat">
                <div className="stat-value">102</div>
                <div className="stat-label">Products</div>
              </div>
            </div>
            <div className="contact-seller">
              <button className="contact-btn"><i className="fas fa-comments"></i> Chat now</button>
              <button className="contact-btn"><i className="fas fa-store"></i> View profile</button>
            </div>
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ccc' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <i className="fas fa-map-marker-alt" style={{ marginRight: '8px', color: '#8B96A5' }}></i>
                <span style={{ fontSize: '14px', color: '#606060' }}>Germany, Berlin</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-check-circle" style={{ marginRight: '8px', color: '#28a745' }}></i>
                <span style={{ fontSize: '14px', color: '#606060' }}>Verified Supplier</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="product-tabs">
          <div className="tab-headers">
            <button className="tab-header active">Description</button>
            <button className="tab-header">Specifications</button>
            <button className="tab-header">Reviews</button>
          </div>
          <div className="tab-content active">
            <p>{product.description}</p>
          </div>
        </div>

        {/* Related Products */}
        <div className="related-products">
          <h3>Related Products</h3>
          <div className="products-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="product-card">
                <img src="/imgs/3185113.jpg" alt="related" />
                <h4>Sample product {i}</h4>
                <div className="price">$99.99</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer id="footer">
        <div className="newsletter">
          <h2>Subscribe to our Newsletter</h2>
          <p>Get daily news on upcoming offers from many suppliers all over the world</p>
          <form action="#" method="post">
            <input type="email" placeholder="Email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
        <div className="footer-container">
          <div className="footer-links">
            <div className="company-info">
              <img src="/imgs/logo-colored.svg" alt="logo" height="46px" width="150px" />
              <p>Best information about the company goes here but now lorem ipsum is</p>
              <div className="company-links">
                <a href="#"><img src="/imgs/facebook3.png" alt="Facebook" /></a>
                <a href="#"><img src="/imgs/twitter3.png" alt="Twitter" /></a>
                <a href="#"><img src="/imgs/linkedin3.png" alt="LinkedIn" /></a>
                <a href="#"><img src="/imgs/instagram3.png" alt="Instagram" /></a>
                <a href="#"><img src="/imgs/youtube3.png" alt="YouTube" /></a>
              </div>
            </div>
            <div className="links">
              <h3>About</h3>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Find Store</a></li>
                <li><a href="#">Categories</a></li>
                <li><a href="#">Blogs</a></li>
              </ul>
            </div>
            <div className="links">
              <h3>Partnership</h3>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Find Store</a></li>
                <li><a href="#">Categories</a></li>
                <li><a href="#">Blogs</a></li>
              </ul>
            </div>
            <div className="links">
              <h3>Information</h3>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Money Refund</a></li>
                <li><a href="#">Shipping</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
            <div className="links">
              <h3>For Users</h3>
              <ul>
                <li><a href="#">Login</a></li>
                <li><a href="#">Register</a></li>
                <li><a href="#">Settings</a></li>
                <li><a href="#">My Orders</a></li>
              </ul>
            </div>
            <div className="links">
              <h3>Get App</h3>
              <ul>
                <li><a href="#"><img src="/imgs/apple store.png" alt="apple store" /></a></li>
                <li><a href="#"><img src="/imgs/google play.png" alt="google play" /></a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bar">
            <div className="bar-content">
              <div className="copyright">
                <p>© 2023 Ecommerce.</p>
              </div>
              <div className="language">
                <img src="/imgs/flag.png" alt="en" height="17px" />
                <p>English</p>
                <img src="/imgs/expand_less.png" alt="arrow" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Details;
