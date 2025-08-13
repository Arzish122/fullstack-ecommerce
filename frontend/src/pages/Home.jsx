// Home.jsx
import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import '../styles/style.css';

const EcommerceStore = () => {
  const navigate = useNavigate();

  // -----------------------------
  // Countdown timer state
  // -----------------------------
  const [countdown, setCountdown] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  // -----------------------------
  // Search state (from Product.jsx)
  // -----------------------------
  const [allProducts, setAllProducts] = useState([]);
  const [currentProducts, setCurrentProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // -----------------------------
  // Fetch all products for local filtering
  // -----------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/products");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setAllProducts(data);
        setCurrentProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  // -----------------------------
  // Handle search input (local filtering)
  // -----------------------------
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (product) => {
    setSearchQuery(product.title);
    setShowSuggestions(false);
    navigate(`/product-details/${product.id}`);
  };

  // -----------------------------
  // Filtered suggestions (top 5)
  // -----------------------------
  const filteredSuggestions = currentProducts
    .filter((product) => product.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  // -----------------------------
  // Countdown timer effect
  // -----------------------------
  useEffect(() => {
    const countDownDate = new Date("Aug 15, 2025 00:00:00 GMT+0500").getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = countDownDate - now;
      if (distance < 0) {
        clearInterval(timer);
        setCountdown({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setCountdown({
        days: days < 10 ? "0" + days : days.toString(),
        hours: hours < 10 ? "0" + hours : hours.toString(),
        minutes: minutes < 10 ? "0" + minutes : minutes.toString(),
        seconds: seconds < 10 ? "0" + seconds : seconds.toString()
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isUserAdmin = true;

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="app">
      <header id="header">
        <div className="head-container">
          <div className="logo-div">
            <Link to="/" className="brand-logo">
              <img src="/imgs/logo-colored.svg" alt="logo" />
            </Link>
          </div>

          {/* SEARCH BAR with local suggestions */}
          <div className="search-bar" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => {
                if (filteredSuggestions.length > 0) setShowSuggestions(true);
              }}
              aria-label="Search products"
            />
            <button className="search-btn" aria-label="Search button">Search</button>

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
                  {filteredSuggestions.map((product) => (
                    <li
                      key={product.id}
                      onClick={() => handleSuggestionClick(product)}
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
                          src={`data:image/jpeg;base64,${product.image}`}
                          alt={product.title}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
                          onError={(e) => { e.target.onerror = null; e.target.src = '/imgs/placeholder.png'; }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{product.title}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>${Number(product.current_price || 0).toFixed(2)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ---------------- MENU OPTIONS ---------------- */}
          <div className="menu-div">
            <div className="menu-opt">
              <Link to="/login">
                <img src="/imgs/account vector.png" alt="user" />
                <span>Profile</span>
              </Link>
            </div>
            <div className="menu-opt">
              <Link to="/messages">
                <img src="/imgs/conversation vector.png" alt="Message" />
                <span>Message</span>
              </Link>
            </div>
            <div className="menu-opt">
              <Link to="/orders">
                <img src="/imgs/heart vector.png" alt="heart" />
                <span>Orders</span>
              </Link>
            </div>
            <div className="menu-opt">
              <Link to="/cart">
                <img src="/imgs/cart vector.png" alt="cart" />
                <span>My Cart</span>
              </Link>
            </div>
            {isUserAdmin && (
              <div className="menu-opt">
                <Link to="/admin-dashboard">
                  <img src="\imgs\360_F_65756860_GUZwzOKNMUU3HldFoIA44qss7ZIrCG8I.jpg" alt="admin" />
                  <span>Admin</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- NAVBAR ---------------- */}
        <nav className="navbar">
          <div className="nav-links">
            <Link to="/product">
              <img src="/imgs/menu.png" alt="menu" style={{ marginRight: '5px' }} />
              <span>All Categories</span>
            </Link>
            <Link to="/offers">Hot Offers</Link>
            <Link to="/gifts">Gift Boxes</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/help">
              <span>Help</span>
              <img src="/imgs/expand_less.png" alt="dropdown arrow" style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>

          <div className="dropdown">
            <div className="lang-dropdown">
              <Link to="#">
                <span>English, USD</span>
                <img src="/imgs/expand_less.png" alt="dropdown arrow" style={{ transform: 'rotate(180deg)' }} />
              </Link>
            </div>
            <div className="ship-dropdown">
              <Link to="#">
                <span>Ship to </span>
                <img src="/imgs/icon.png" alt="flag" style={{ marginLeft: '10px' }} />
                <img src="/imgs/expand_less.png" alt="dropdown arrow" style={{ transform: 'rotate(180deg)' }} />
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* ====================== MAIN ====================== */}
      <main id="main">
        <section className="main-section">
          <div className="categories">
            <p><Link to="/product?category=Automobiles">Automobiles</Link></p>
            <p><Link to="/product?category=Clothes and wear">Clothes and wear</Link></p>
            <p><Link to="/product?category=Home interiors">Home interiors</Link></p>
            <p><Link to="/product?category=Computer and tech">Computer and tech</Link></p>
            <p><Link to="/product?category=Sports and outdoor">Sports and outdoor</Link></p>
            <p><Link to="/product?category=Animal and pets">Animal and pets</Link></p>
            <p><Link to="/product?category=Machinery tools">Machinery tools</Link></p>
          </div>

          <div className="banner">
            <img src="/imgs/banner.png" alt="banner" width="664px" height="373px" />
            <div className="banner-text">
              <p style={{fontSize: '28px'}}>Latest Trending</p>
              <h2 style={{fontSize: '32px'}}>Electronic items</h2>
              <button type="button">Learn more</button>
            </div>
          </div>

          <div className="user-promo">
            <div className="user">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/imgs/Avatar.png" alt="User" />
                <span style={{marginLeft: '10px'}}>Hi, user<br />let's get started</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button">Join now</button>
                <button type="button">Log in</button>
              </div>
            </div>

            <div className="promo">
              <p>Get US $10 off <br />with a new<br /> supplier</p>
            </div>

            <div className="quote">
              <p>Send quotes with <br />supplier <br />preferences</p>
            </div>
          </div>
        </section>

        <section className="sale-section">
          <div className="deal">
            <h2>Deals and offers</h2>
            <p>Hygiene equipments</p>
            <div id="countdown-timer">
              <div className="countdown-segment">
                <span className="countdown-value">{countdown.days}</span>
                <span className="countdown-label">Days</span>
              </div>
              <div className="countdown-segment">
                <span className="countdown-value">{countdown.hours}</span>
                <span className="countdown-label">Hours</span>
              </div>
              <div className="countdown-segment">
                <span className="countdown-value">{countdown.minutes}</span>
                <span className="countdown-label">Mins</span>
              </div>
              <div className="countdown-segment">
                <span className="countdown-value">{countdown.seconds}</span>
                <span className="countdown-label">Secs</span>
              </div>
            </div>
          </div>

          <div className="sale-items">
            <div className="item">
              <div>
                <img src="/imgs/smartwatch.png" alt="smartwatch" />
              </div>
              <p>Smartwatches</p>
              <span>-25%</span>
            </div>

            <div className="item">
              <div>
                <img src="/imgs/laptop.png" alt="laptop" />
              </div>
              <p>Laptops</p>
              <span>-15%</span>
            </div>

            <div className="item">
              <div>
                <img src="/imgs/camera.png" alt="camera" />
              </div>
              <p>GoPro cameras</p>
              <span>-40%</span>
            </div>

            <div className="item">
              <div>
                <img src="/imgs/headphone.png" alt="headphone" />
              </div>
              <p>Headphones</p>
              <span>-25%</span>
            </div>

            <div className="item">
              <div>
                <img src="/imgs/mobile.png" alt="mobile" />
              </div>
              <p>Smartphones</p>
              <span>-25%</span>
            </div>
          </div>
        </section>

        <section className="items-section">
          <div className="left-aside">
            <img src="/imgs/items grp 1.jpg" alt="group 1" height="257px" />
            <div>
              <h2>Home and<br />outdoor</h2>
              <button type="button">Source now</button>
            </div>
          </div>

          <div className="group">
            <div className="group-item">
              <h3>Soft chairs</h3>
              <p>From<br />USD 19</p>
              <img src="/imgs/chair.png" alt="chair" />
            </div>

            <div className="group-item">
              <h3>Table lamps</h3>
              <p>From<br />USD 19</p>
              <img src="/imgs/lamp.png" alt="lamp" />
            </div>

            <div className="group-item">
              <h3>Bed mattress</h3>
              <p>From<br />USD 19</p>
              <img src="/imgs/matress.png" alt="mattress" />
            </div>

            <div className="group-item">
              <h3>Water and pots</h3>
              <p>From<br />USD 19</p>
              <img src="/imgs/pot small.png" alt="pot" />
            </div>

            <div className="group-item">
              <h3>Kitchen mixer</h3>
              <p>From<br />USD 99</p>
              <img src="/imgs/mixer.png" alt="mixer" />
            </div>

            <div className="group-item">
              <h3>Blenders</h3>
              <p>From<br />USD 199</p>
              <img src="/imgs/blender.png" alt="blender" />
            </div>

            <div className="group-item">
              <h3>Home appliances</h3>
              <p>From<br />USD 29</p>
              <img src="/imgs/rasm.png" alt="rasm" />
            </div>

            <div className="group-item">
              <h3>Coffee makers</h3>
              <p>From<br />USD 49</p>
              <img src="/imgs/plant.png" alt="plant" />
            </div>
          </div>
        </section>

        <section className="items-section">
          <div className="left-aside">
            <img src="/imgs/items grp 2.png" alt="group 1" />
            <div style={{marginTop: '10px'}}>
              <h2>Consumer<br />electronics and<br />gadgets</h2>
              <button type="button">Source now</button>
            </div>
          </div>

          <div className="group">
            <div className="group-item">
              <h3>Smartwatches</h3>
              <p>From<br />USD 19</p>
              <img src="/imgs/smartwatch small.png" alt="smartwatch" />
            </div>

            <div className="group-item">
              <h3>Cameras</h3>
              <p>From<br />USD 89</p>
              <img src="/imgs/camera small.png" alt="camera" />
            </div>

            <div className="group-item">
              <h3>Headphones</h3>
              <p>From<br />USD 10</p>
              <img src="/imgs/simple headphone small.png" alt="headphones" />
            </div>

            <div className="group-item">
              <h3>Electric Kettle</h3>
              <p>From<br />USD 90</p>
              <img src="/imgs/kettle small.png" alt="kettle" />
            </div>

            <div className="group-item">
              <h3>Gaming set</h3>
              <p>From<br />USD 35</p>
              <img src="/imgs/headphone Small.png" alt="headphone" />
            </div>

            <div className="group-item">
              <h3>Laptops and PCs</h3>
              <p>From<br />USD 299</p>
              <img src="/imgs/laptop small.png" alt="laptop" />
            </div>

            <div className="group-item">
              <h3>Smartphones</h3>
              <p>From<br />USD 29</p>
              <img src="/imgs/tablet.png" alt="tablet" />
            </div>

            <div className="group-item">
              <h3>Iphones</h3>
              <p>From<br />USD 249</p>
              <img src="/imgs/iphone.png" alt="iphone" />
            </div>
          </div>
        </section>

        <section className="send-request-section">
          <div className="left-content">
            <h2>An easy way to send requests to all suppliers</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt.</p>
          </div>
          <div className="right-content">
            <h3>Send quote to suppliers</h3>
            <input type="text" placeholder="What item you need?" />
            <textarea placeholder="Type more details"></textarea>
            <div className="quantity-row">
              <input type="number" placeholder="Quantity" min="1" />
              <select>
                <option>Pcs</option>
                <option>Kg</option>
                <option>Units</option>
              </select>
            </div>
            <button className="send-quote-btn">Send quote</button>
          </div>
        </section>

        <section className="recommended-items-section">
          <h2>Recommended items</h2>
          <div className="recommended-items-grid">
            <div className="recommended-item">
              <img src="/imgs/Bitmap-1.png" alt="T-Shirt" />
              <p>$10.30</p>
              <span>T-shirts with multiple colors, for men</span>
            </div>
            <div className="recommended-item">
              <img src="/imgs/Bitmap.png" alt="Jacket" />
              <p>$10.30</p>
              <span>Jeans shorts for men blue color</span>
            </div>
            <div className="recommended-item">
              <img src="/imgs/2 1.png" alt="Coat" />
              <p>$12.50</p>
              <span>Brown winter coat medium size</span>
            </div>
            <div className="recommended-item">
              <img src="/imgs/backpack.png" alt="Wallet" />
              <p>$34.00</p>
              <span>Jeans bag for travel for men</span>
            </div>
            <div className="recommended-item">
              <img src="/imgs/wallet.png" alt="Backpack" />
              <p>$99.00</p>
              <span>Leather wallet</span>
            </div>
            <div className="recommended-item">
              <img src="/imgs/camera small.png" alt="Jeans" />
              <p>$9.99</p>
              <span>Canon camera black, 100x zoom</span>
            </div>
            <div className="recommended-item">
              <img src="/imgs/headphone.png" alt="Headphone" />
              <p>$8.99</p>
              <span>Headset for gaming with mic</span>
            </div>
            <div className="recommended-item">
              <img src="/imgs/smartwatch.png" alt="Smartwatch" />
              <p>$10.30</p>
              <span>Smartwatch silver color modern</span>
            </div>
            <div className="recommended-item">
              <img src="/imgs/mobile.png" alt="Pot" />
              <p>$10.30</p>
              <span>Mobile Phone</span>
            </div>
            <div className="recommended-item">
              <img src="/imgs/laptop.png" alt="Thermos" />
              <p>$80.95</p>
              <span>Laptop</span>
            </div>
          </div>
        </section>

        <section className="extra-services">
          <h2>Our extra services</h2>
          <div className="services-grid">
            <div className="service-item">
              <div className="service-image">
                <img src="/imgs/image 108.png" alt="Service 1" />
                <div className="service-icon">
                  <img src="https://images.vexels.com/media/users/3/132068/isolated/preview/f9bb81e576c1a361c61a8c08945b2c48-search-icon.png?w=360" alt="Search Icon" />
                </div>
              </div>
              <p>Source from Industry Hubs</p>
            </div>
            <div className="service-item">
              <div className="service-image">
                <img src="/imgs/image 104.png" alt="Service 2" />
                <div className="service-icon">
                  <img src="https://img.favpng.com/12/10/10/computer-icons-box-icon-design-png-favpng-ZeuhNMrYjdQhJEx016bx1BRHH.jpg" alt="Customize Icon" />
                </div>
              </div>
              <p>Customize Your Products</p>
            </div>
            <div className="service-item">
              <div className="service-image">
                <img src="/imgs/image 106.png" alt="Service 3" />
                <div className="service-icon">
                  <img src="https://i.pinimg.com/564x/a5/50/be/a550bee36720a085b8e1482b0415a8d0.jpg" alt="Shipping Icon" />
                </div>
              </div>
              <p>Fast, reliable shipping by ocean or air</p>
            </div>
            <div className="service-item">
              <div className="service-image">
                <img src="/imgs/image 107.png" alt="Service 4" />
                <div className="service-icon">
                  <img src="https://www.clipartmax.com/png/middle/348-3480600_equipment-inspection-inspection-magnifying-glass-inspection-icon-png.png" alt="Inspection Icon" />
                </div>
              </div>
              <p>Product monitoring and inspection</p>
            </div>
          </div>
        </section>

        <section className="suppliers-by-region">
          <h2>Suppliers by region</h2>
          <div className="regions-grid">
            <div className="region-item">
              <img src="/imgs/Property 1=AE.png" alt="UAE Flag" />
              <span>Arabic Emirates</span>
              <p>Duabi info</p>
            </div>
            <div className="region-item">
              <img src="/imgs/Property 1=AU.png" alt="Australia Flag" />
              <span>Australia</span>
              <p>Sydeny info</p>
            </div>
            <div className="region-item">
              <img src="/imgs/Property 1=US.png" alt="US Flag" />
              <span>United States</span>
              <p>New York info</p>
            </div>
            <div className="region-item">
              <img src="/imgs/Property 1=RU.png" alt="Russia Flag" />
              <span>Russia</span>
              <p>Moscow info</p>
            </div>
            <div className="region-item">
              <img src="/imgs/Property 1=IT.png" alt="Italy Flag" />
              <span>Italy</span>
              <p>Milan info</p>
            </div>
            <div className="region-item">
              <img src="/imgs/Property 1=DK.png" alt="Denmark Flag" />
              <span>Denmark</span>
              <p>Copenhagen info</p>
            </div>
            <div className="region-item">
              <img src="/imgs/Property 1=FR.png" alt="France Flag" />
              <span>France</span>
              <p>Paris info</p>
            </div>
            <div className="region-item">
              <img src="/imgs/Property 1=CN.png" alt="China Flag" />
              <span>China</span>
              <p>Shanghai info</p>
            </div>
            <div className="region-item">
              <img src="/imgs/Property 1=GB.png" alt="UK Flag" />
              <span>Great Britain</span>
              <p>London info</p>
            </div>
          </div>
        </section>
      </main>

      {/* ====================== FOOTER ====================== */}
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
    </div>
  );
};

export default EcommerceStore;
