

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/cart.css";

async function safeParseJSON(response) {
  try {
    return await response.json();
  } catch (err) {
    try {
      const text = await response.text();
      return { _rawText: text };
    } catch (err2) {
      return {};
    }
  }
}


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ======================================================================== */
/* Main Component                                                           */
/* ======================================================================== */

const Cart = () => {
  const navigate = useNavigate();

  /* --------------------------
     Data & UI state variables
     -------------------------- */
  // Cart items retrieved from backend
  const [cartItems, setCartItems] = useState([]);

  // Loading / error states for data fetch
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Coupon / pricing state
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const tax = 14.0; // match previous UI (static)

  // UI feedback
  const [toastMessage, setToastMessage] = useState(""); // for small actions
  const [showOrderSuccess, setShowOrderSuccess] = useState(false); // big overlay only for checkout
  const [orderSuccessMessage, setOrderSuccessMessage] = useState(""); // overlay message
  const [isPerformingAction, setIsPerformingAction] = useState(false); // blocks buttons while processing

  // Saved for later — keep placeholders client-side per your request
  const [savedForLater, setSavedForLater] = useState([
    {
      id: "saved-1",
      title: "Self-Cleaning Cat Litter Box",
      price: 120.0,
      image: "/public/imgs/3185113.jpg",
    },
    {
      id: "saved-2",
      title: "Modern Design Floor Lamp",
      price: 150.0,
      image: "/public/imgs/3185113.jpg",
    },
    {
      id: "saved-3",
      title: "Industrial Soldering Iron Kit",
      price: 50.0,
      image: "/public/imgs/3185113.jpg",
    },
    {
      id: "saved-4",
      title: "Men's Lightweight Running Shoes",
      price: 70.0,
      image: "/public/imgs/3185113.jpg",
    },
  ]);

  /* ================================================================== */
  /* fetchCart - load cart items from backend                           */
  /* ================================================================== */
  const fetchCart = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:5000/cart", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        // Attempt to parse server error
        const parsed = await safeParseJSON(res);
        const msg = parsed && parsed.error ? parsed.error : `Server error ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();

      // Normalize the backend rows to the shape we expect in the UI.
      // Your app.py returns the cart_items joined with product fields; we map them here.
      const normalized = (Array.isArray(data) ? data : []).map((row) => {
        // row likely contains fields: id (cart_items.id), product_id, quantity, title, image, current_price, old_price, description/details, seller
        return {
          id: row.id, // cart_items.id (unique per cart item)
          product_id: row.product_id ?? row.productId ?? row.product_id,
          quantity: Number(row.quantity ?? 1),
          title: row.title ?? row.name ?? "Product",
          current_price: Number(row.current_price ?? row.currentPrice ?? row.price ?? 0),
          old_price: row.old_price ?? row.oldPrice ?? null,
          image: row.image ?? "", // assume base64 string (no data: prefix) - same as Details.jsx
          details: row.description ?? row.details ?? "",
          seller: row.seller ?? "",
          // optional: rating, orders, etc if present
          rating: row.rating ?? null,
          orders: row.orders ?? null,
        };
      });

      setCartItems(normalized);
    } catch (err) {
      console.error("fetchCart error:", err);
      setError(String(err.message || err));
      setCartItems([]); // clear on error to avoid stale UI
    } finally {
      setLoading(false);
    }
  };

  // Load cart on mount
  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================================================================== */
  /* Totals & pricing                                                    */
  /* ================================================================== */
  const subtotal = cartItems.reduce(
    (acc, it) => acc + Number(it.current_price || 0) * Number(it.quantity || 0),
    0
  );

  const total = subtotal - discount + tax;

  /* ================================================================== */
  /* Toast / overlay helpers                                             */
  /* ================================================================== */

  // Small toast used for quantity updates, removals, etc.
  const showToast = async (msg, duration = 1800) => {
    setToastMessage(msg);
    await sleep(duration);
    setToastMessage("");
  };

  // Big overlay shown only for confirmed checkout success
  const showOrderOverlay = (msg) => {
    setOrderSuccessMessage(msg || "Order Placed Successfully! Your order will be processed shortly.");
    setShowOrderSuccess(true);
  };

 
  const updateQuantity = async (cartItemId, newQty) => {
    if (!cartItemId) return;
    if (newQty < 1) return;
    setIsPerformingAction(true);
    setError("");
    try {
      const res = await fetch(`http://127.0.0.1:5000/cart/update/${cartItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      if (!res.ok) {
        const parsed = await safeParseJSON(res);
        const msg = parsed && parsed.error ? parsed.error : `Failed to update (${res.status})`;
        throw new Error(msg);
      }

      // refresh cart items to reflect server state (ensures consistency)
      await fetchCart();

      // Small feedback only — DO NOT open the big overlay
      await showToast("Quantity updated");
    } catch (err) {
      console.error("updateQuantity error:", err);
      setError(String(err.message || err));
      await showToast("Failed to update quantity");
    } finally {
      setIsPerformingAction(false);
    }
  };

  /**
   * removeCartItem
   * - cartItemId: ID from cart_items table (cart item id)
   */
  const removeCartItem = async (cartItemId) => {
    if (!cartItemId) return;
    if (!window.confirm("Are you sure you want to remove this item from your cart?")) return;
    setIsPerformingAction(true);
    setError("");
    try {
      const res = await fetch(`http://127.0.0.1:5000/cart/remove/${cartItemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const parsed = await safeParseJSON(res);
        const msg = parsed && parsed.error ? parsed.error : `Failed to remove (${res.status})`;
        throw new Error(msg);
      }

      // refresh cart
      await fetchCart();
      await showToast("Item removed");
    } catch (err) {
      console.error("removeCartItem error:", err);
      setError(String(err.message || err));
      await showToast("Failed to remove item");
    } finally {
      setIsPerformingAction(false);
    }
  };

  /**
   * clearCart
   * - Deletes each item in series (or parallel) from backend.
   * - Keeps backend unchanged (no need to create a /cart/clear route).
   */
  const clearCart = async () => {
    if (!cartItems.length) {
      await showToast("Cart is already empty");
      return;
    }
    if (!window.confirm("Remove all items from your cart?")) return;
    setIsPerformingAction(true);
    setError("");
    try {
      // Delete items in parallel but wait for all to complete
      await Promise.all(
        cartItems.map((ci) =>
          fetch(`http://127.0.0.1:5000/cart/remove/${ci.id}`, {
            method: "DELETE",
          })
        )
      );

      await fetchCart();
      await showToast("All items removed");
    } catch (err) {
      console.error("clearCart error:", err);
      setError(String(err.message || err));
      await showToast("Failed to clear cart");
    } finally {
      setIsPerformingAction(false);
    }
  };

  /**
   * handleCheckout
   * - Simulates placing an order, removes items from cart, and shows the large overlay.
   * - Only this function triggers the showOrderOverlay (big overlay).
   */
  const handleCheckout = async () => {
    if (!cartItems.length) {
      alert("Your cart is empty.");
      return;
    }
    if (!window.confirm("Place order and clear the cart?")) return;

    setIsPerformingAction(true);
    setError("");
    try {
      // Place order: in a real app you'd POST to /orders with items + payment details.
      // Here we simulate success and delete all cart items.
      await Promise.all(
        cartItems.map((ci) =>
          fetch(`http://127.0.0.1:5000/cart/remove/${ci.id}`, {
            method: "DELETE",
          })
        )
      );

      await fetchCart();

      showOrderOverlay("Order Placed Successfully! We'll email your order confirmation shortly.");
    } catch (err) {
      console.error("handleCheckout error:", err);
      setError(String(err.message || err));
      await showToast("Checkout failed");
    } finally {
      setIsPerformingAction(false);
    }
  };

  /* ================================================================== */
  /* Saved for later handlers (client-side only as requested)           */
  /* ================================================================== */

  const moveToSavedForLater = async (cartItem) => {
    if (!cartItem) return;
    // add to saved list locally
    const saved = {
      id: `saved-${Date.now()}`,
      title: cartItem.title,
      price: Number(cartItem.current_price || 0),
      image: cartItem.image ? `data:image/jpeg;base64,${cartItem.image}` : "/imgs/placeholder.png",
    };
    setSavedForLater((prev) => [saved, ...prev]);

    // remove from cart (backend)
    await removeCartItem(cartItem.id);
    // removeCartItem already shows a toast
  };

  const moveSavedToCart = (savedItem) => {
    // Placeholder: without persisted product_id, we can't add to DB reliably.
    // We'll show a toast and remove from saved list (simulate)
    setSavedForLater((prev) => prev.filter((s) => s.id !== savedItem.id));
    showToast("Moved to cart (client-side simulation)");
    // In a real flow you would navigate to the product page or call an API to add by product_id.
  };

  /* ================================================================== */
  /* Coupon logic (simple)                                              */
  /* ================================================================== */

  const applyCoupon = () => {
    if (!couponCode || couponCode.trim() === "") {
      alert("Please enter a coupon code");
      return;
    }
    const code = couponCode.trim().toUpperCase();
    if (code === "DISCOUNT10") {
      const newDiscount = subtotal * 0.1;
      setDiscount(Number(newDiscount.toFixed(2)));
      showToast("Coupon applied: 10% off");
    } else {
      setDiscount(0);
      alert("Invalid coupon code");
    }
  };

  /* ================================================================== */
  /* Image rendering helper - matches Details.jsx behavior exactly       */
  /* - If backend returns base64 string, we use data:image/jpeg;base64,  */
  /*   prefix just like Details.jsx did                                   */
  /* - If backend returns empty / null, fallback to placeholder image    */
  /* ================================================================== */

  const renderImageSrc = (img) => {
    if (!img) return "/imgs/placeholder.png";
    // Details.jsx expects plain base64 string and prefixes with data:image/jpeg;base64,
    // so we follow the exact same logic for consistency.
    return `data:image/jpeg;base64,${img}`;
  };

  /* ================================================================== */
  /* Verbose JSX rendering — explicit sections with many comments        */
  /* ================================================================== */

  return (
    <>
      {/* ========================= Header (full) ========================= */}
      <header id="header">
        <div className="head-container">
          <div className="logo-div">
            <a href="/" className="brand-logo">
              <img src="/imgs/logo-colored.svg" alt="logo" />
            </a>
          </div>

         

          <div className="menu-div">
            <div className="menu-opt">
              <a href="/profile">
                <img src="/imgs/account vector.png" alt="user" />
                <span>Profile</span>
              </a>
            </div>

            <div className="menu-opt">
              <a href="/messages">
                <img src="/imgs/conversation vector.png" alt="Message" />
                <span>Message</span>
              </a>
            </div>

            <div className="menu-opt">
              <a href="/orders">
                <img src="/imgs/heart vector.png" alt="heart" />
                <span>Orders</span>
              </a>
            </div>

            <div className="menu-opt">
              <a href="/cart">
                <img src="/imgs/cart vector.png" alt="cart" />
                <span>My Cart</span>
              </a>
            </div>
          </div>
        </div>

        <nav className="navbar">
          <div className="nav-links">
            <a href="/product">
              <img src="/imgs/menu.png" alt="menu" style={{ marginRight: "5px" }} />
              <span>All Categories</span>
            </a>

            <a href="/offers">Hot Offers</a>
            <a href="/gifts">Gift Boxes</a>
            <a href="/projects">Projects</a>
            <a href="/menuitems">Menu Items</a>

            <a href="/help">
              <span>Help</span>
              <img
                src="/imgs/expand_less.png"
                alt="dropdown arrow"
                style={{ transform: "rotate(180deg)" }}
              />
            </a>
          </div>

          <div className="dropdown">
            <div className="lang-dropdown">
              <a href="#">
                <span>English, USD</span>
                <img src="/imgs/expand_less.png" alt="dropdown arrow" style={{ transform: "rotate(180deg)" }} />
              </a>
            </div>

            <div className="ship-dropdown">
              <a href="#">
                <span>Ship to </span>
                <img src="/imgs/icon.png" alt="flag" style={{ marginLeft: "10px" }} />
                <img src="/imgs/expand_less.png" alt="dropdown arrow" style={{ transform: "rotate(180deg)" }} />
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* ========================= Toast (small feedback) ========================= */}
      {toastMessage && (
        <div
          className="cart-toast"
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            zIndex: 9999,
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            fontSize: 14,
          }}
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}

      {/* ========================= Main content wrapper ========================= */}
      <main className="main-content-area">
        <div className="cart-main-inner">
          {/* Header/title */}
          <div className="cart-header-title">
            <h2>My cart ({cartItems.length})</h2>
          </div>

          {/* Main white card containing items and summary */}
          <div className="cart-content-wrapper">
            {/* ========================= Left: Cart Items Section ========================= */}
            <div className="cart-items-section">
              {/* Loading state */}
              {loading && (
                <div style={{ padding: 20 }}>
                  <p>Loading cart items...</p>
                </div>
              )}

              {/* Error state */}
              {!loading && error && (
                <div style={{ padding: 20, color: "red" }}>
                  <p>{error}</p>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && cartItems.length === 0 && (
                <div className="empty-cart-message" style={{ marginTop: 10 }}>
                  <p>No items in the cart.</p>
                  <Link to="/product" className="back-to-shop-btn">
                    <i className="fas fa-arrow-left"></i> Continue Shopping
                  </Link>
                </div>
              )}

              {/* Items list */}
              {!loading && !error && cartItems.length > 0 && (
                <>
                  {/* Iterate through cartItems and render each item using the classes from cart.css */}
                  {cartItems.map((item) => (
                    <div className="cart-item" key={item.id}>
                      {/* Image */}
                      <div className="item-image">
                        <img
                          src={renderImageSrc(item.image)}
                          alt={item.title}
                          onError={(e) => {
                            // Fallback in case base64 or image fails to render
                            e.target.onerror = null;
                            e.target.src = "/imgs/placeholder.png";
                          }}
                        />
                      </div>

                      {/* Details */}
                      <div className="item-details">
                        <h3>{item.title}</h3>
                        {item.details ? <p className="item-specs">{item.details}</p> : null}
                        {item.seller ? <p className="item-seller">Seller: {item.seller}</p> : null}

                        {/* Actions: Remove, Save for later */}
                        <div className="item-actions" style={{ marginTop: 10 }}>
                          <button
                            onClick={() => removeCartItem(item.id)}
                            disabled={isPerformingAction}
                          >
                            Remove
                          </button>

                          <button
                            onClick={() => moveToSavedForLater(item)}
                            disabled={isPerformingAction}
                          >
                            Save for later
                          </button>
                        </div>
                      </div>

                      {/* Price & quantity */}
                      <div className="item-price-quantity">
                        <span className="item-price">${Number(item.current_price).toFixed(2)}</span>

                        <div className="quantity-control">
                          <select
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                            disabled={isPerformingAction}
                          >
                            {[...Array(10).keys()].map((i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Bottom actions under the list */}
                  <div className="cart-actions-bottom" style={{ marginTop: 20 }}>
                    <Link to="/product" className="back-to-shop-btn">
                      <i className="fas fa-arrow-left"></i> Back to shop
                    </Link>

                    <div>
                      {cartItems.length > 0 && (
                        <button className="remove-all-btn" onClick={clearCart} disabled={isPerformingAction}>
                          Remove all
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info boxes */}
                  <div className="cart-info-boxes" style={{ marginTop: 30 }}>
                    <div className="info-box">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDfcb5_YID3Oqvc1zJtuXB3RAzufN8uOOzZA&s" alt="Secure payment" />
                      <span>Secure payment</span>
                    </div>

                    <div className="info-box">
                      <img src="https://media.istockphoto.com/id/1353814664/vector/support-customer-24-7-silhouette-icon-help-service-call-center-logo-headphone-with-bubble.jpg?s=612x612&w=0&k=20&c=lLVd-J-OicmgNpHtaI7CU6mMsAyVW60CqD7NnEYyhcQ=" alt="Customer support" />
                      <span>Customer support</span>
                    </div>

                    <div className="info-box">
                      <img src="https://images.seeklogo.com/logo-png/48/2/food-delivery-symbol-logo-png_seeklogo-486549.png" alt="Free delivery" />
                      <span>Free delivery</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ========================= Right: Order Summary Section ========================= */}
            <div className="order-summary-section">
              <div style={{ padding: 8 }}>
                {/* Coupon */}
                <div className="coupon-section" style={{ marginBottom: 12 }}>
                  <p>Have a coupon?</p>
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Add coupon"
                    />
                    <button onClick={applyCoupon}>Apply</button>
                  </div>
                </div>

                {/* Summary details */}
                <div className="summary-details">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="summary-row">
                    <span>Discount:</span>
                    <span className="discount-amount">-${discount.toFixed(2)}</span>
                  </div>

                  <div className="summary-row">
                    <span>Tax:</span>
                    <span>+${tax.toFixed(2)}</span>
                  </div>

                  <div className="summary-total" style={{ marginTop: 20 }}>
                    <span>Total:</span>
                    <span className="total-amount">${total.toFixed(2)}</span>
                  </div>

                  <button
                    className="checkout-btn"
                    onClick={handleCheckout}
                    disabled={isPerformingAction}
                    style={{ marginTop: 18 }}
                  >
                    Checkout
                  </button>

                  <div className="payment-methods" style={{ marginTop: 16 }}>
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTF_70SiSuYPUjOCg5TzpqEv1JoWjh0Gy1rbg&s" alt="Visa" />
                    <img src="https://icon2.cleanpng.com/lnd/20241123/ca/85dda930e3465f586e2b20700028d0.webp" alt="Mastercard" />
                    <img src="https://cdn.pixabay.com/photo/2018/05/08/21/29/paypal-3384015_1280.png" alt="PayPal" />
                    <img src="https://w7.pngwing.com/pngs/941/692/png-transparent-black-small-apple-logo-logo-material-apple-logo-black-thumbnail.png" alt="Apple Pay" />
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZk_ZL2j-HMo6OCx2-4rT8xLYjGgEkCP8AzQ&s" alt="Google Pay" />
                  </div>
                </div>
              </div>
            </div>
          </div> {/* endcart-content-wrapper */}

          {/* ========================= Saved for Later Section (client-side placeholders) ========================= */}
          <div className="saved-for-later-section" style={{ marginTop: 20 }}>
            <h2>Saved for later</h2>
            <div className="saved-items-grid" style={{ marginTop: 12 }}>
              {savedForLater.map((s) => (
                <div className="saved-item-card" key={s.id}>
                  <img src={s.image || "/imgs/placeholder.png"} alt={s.title} />
                  <div className="saved-item-info">
                    <p className="saved-item-price">${Number(s.price || 0).toFixed(2)}</p>
                    <p className="saved-item-title">{s.title}</p>
                    <button className="move-to-cart-btn" onClick={() => moveSavedToCart(s)}>
                      Move to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================= Super Discount Banner (retained) ========================= */}
          <div className="super-discount-banner" style={{ marginTop: 20 }}>
            <div className="inner-content">
              <div className="banner-content">
                <h2>Super discount on more than 100 USD</h2>
                <p>Have you ever finally just quality info</p>
              </div>
              <button className="shop-now-btn">Shop now</button>
            </div>
          </div>
        </div> {/* cart-main-inner */}
      </main>

      {/* ========================= Footer (full) ========================= */}
      <footer id="footer">
        <div className="newsletter">
          <div className="inner-content">
            <h2>Subscribe to our Newsletter</h2>
            <p>Get daily news on upcoming offers from many suppliers all over the world</p>
            <form>
              <input type="email" placeholder="Email" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer-content-wrapper">
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

      {/* ========================= Order Success Overlay (only shown after checkout) ========================= */}
      {showOrderSuccess && (
        <div className="order-success-overlay" role="dialog" aria-modal="true">
          <div className="order-success-message-box">
            <div className="order-success-circle">
              <i className="fas fa-check order-success-tick" style={{ color: "white", fontSize: 40 }}>✓</i>
            </div>
            <h3>Order Placed Successfully!</h3>
            <p>{orderSuccessMessage}</p>
            <button
              className="order-success-close-btn"
              onClick={() => {
                setShowOrderSuccess(false);
                setOrderSuccessMessage("");
                // optionally navigate to orders or home after closing:
                // navigate('/orders')
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
