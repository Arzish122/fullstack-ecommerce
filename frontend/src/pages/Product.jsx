import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "../styles/product.css";

const categories = {
  "Automobiles": ["car", "fuel", "battery", "tire", "seat", "wipers", "cover", "jumper", "floor", "gauge", "air freshener", "headlights"],
  "Clothes and wear": ["shirt", "jeans", "hoodie", "socks", "t-shirt", "jacket", "dress", "jumpsuit", "shoes", "belt", "wear"],
  "Home interior": ["lamp", "rug", "table", "art", "pillow", "vase", "curtain", "mirror", "shelving", "candles"],
  "Computer and tech": ["laptop", "keyboard", "mouse", "hard drive", "monitor", "webcam", "stand", "pc", "ssd"],
  "Sports and outdoor": ["shoes", "yoga", "water bottle"],
  "Animal and pets": ["dog", "cat", "fish", "collar", "shampoo", "pet", "bed", "tank", "food", "leash", "litter"],
  "Machinery tools": ["drill", "welding", "saw", "grinder", "compressor", "machine", "tool"],
  "Electronics": ["headphones", "camera", "speaker", "smartwatch", "projector", "charging pad", "earbuds"]
};

const ProductPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearchQuery = searchParams.get("q") || "";

  const [allProducts, setAllProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("All");
  const [currentProducts, setCurrentProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isGridView, setIsGridView] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const priceMinRef = useRef(null);
  const priceMaxRef = useRef(null);

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

  const applyFilters = (newCategory = currentCategory, newRating = selectedRating) => {
    const min = parseFloat(priceMinRef.current?.value) || 0;
    const max = parseFloat(priceMaxRef.current?.value) || Infinity;
    const filteredProducts = allProducts.filter((product) => {
      const matchesCategory = newCategory === "All" || product.category === newCategory;
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = product.current_price >= min && product.current_price <= max;
      const matchesRating = newRating === 0 || product.star_count === newRating;
      return matchesCategory && matchesSearch && matchesPrice && matchesRating;
    });
    setCurrentProducts(filteredProducts);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters();
  }, [searchQuery, allProducts]);

  const handleCategoryClick = (category) => {
    setCurrentCategory(category);
    applyFilters(category, selectedRating);
  };

  const handleRatingChange = (rating) => {
    const newRating = selectedRating === rating ? 0 : rating;
    setSelectedRating(newRating);
    applyFilters(currentCategory, newRating);
  };

  const handleSearchInput = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const handleSuggestionClick = (title) => {
    setSearchQuery(title);
    setShowSuggestions(false);
    applyFilters();
  };

  // Show only items in the filtered list
  const filteredSuggestions = currentProducts
    .filter((product) => product.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  const renderStars = (starCount) => {
    return Array.from({ length: 5 }, (_, i) => (
      <img
        key={i}
        src="/imgs/star.png"
        alt="star"
        className={i + 1 > starCount ? "empty-star" : ""}
      />
    ));
  };

  const totalPages = Math.ceil(currentProducts.length / productsPerPage);
  const start = (currentPage - 1) * productsPerPage;
  const paginatedProducts = currentProducts.slice(start, start + productsPerPage);

  const ProductCard = ({ product }) => (
    <div className="product-card">
      <Link to={`/product-details/${product.id}`} className="product-image-container">
        <img
          src={`data:image/jpeg;base64,${product.image}`}
          alt={product.title}
          onError={(e) =>
            (e.target.src =
              "https://placehold.co/200x150/EAEAEA/C0C0C0?text=Image+Not+Found")
          }
        />
      </Link>
      <div className="product-details">
        <div className="product-title">{product.title}</div>
        <div className="price-row">
          <span className="current-price">${product.current_price.toFixed(2)}</span>
          {product.old_price && (
            <span className="old-price">${product.old_price.toFixed(2)}</span>
          )}
        </div>
        <div className="rating-row">
          {renderStars(product.star_count)}
          <span>{product.rating}</span>
          <span className="review-count">({product.orders} orders)</span>
        </div>
        <div className="description">{product.description}</div>
        <Link to={`/product-details/${product.id}`} className="view-details-btn">
          View details
        </Link>
      </div>
      <img
        src="/imgs/heart vector.png"
        alt="Add to wishlist"
        className="wishlist-icon"
      />
    </div>
  );

  const ProductList = () => {
    if (paginatedProducts.length === 0) {
      return (
        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            padding: "20px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
          }}
        >
          <h2>No products found</h2>
          <p>Try adjusting your filters or search query.</p>
        </div>
      );
    }
    return (
      <div
        id="product-list-container"
        className={isGridView ? "grid-view" : "list-view"}
      >
        {paginatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* HEADER */}
      <header id="header">
        <div className="head-container">
          <div className="logo-div">
            <a href="/" className="brand-logo">
              <img src="/imgs/logo-colored.svg" alt="logo" />
            </a>
          </div>
          <div className="search-bar" style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search"
              id="search-input"
              value={searchQuery}
              onChange={handleSearchInput}
            />
            <button className="search-btn" onClick={() => applyFilters()}>
              Search
            </button>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul id="search-suggestions">
                {filteredSuggestions.map((product, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(product.title)}
                  >
                    <img
                      src={`data:image/jpeg;base64,${product.image}`}
                      alt={product.title}
                      style={{
                        width: "30px",
                        height: "30px",
                        marginRight: "8px",
                      }}
                    />
                    {product.title} - ${product.current_price.toFixed(2)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="menu-div">
            <div className="menu-opt">
              <a href="#">
                <img src="/imgs/account vector.png" alt="user" />
                <span>Profile</span>
              </a>
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
              <a href="#">
                <img src="/imgs/cart vector.png" alt="cart" />
                <span>My Cart</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="product-page-main">
        <div className="product-page-container">
          <aside className="sidebar">
            <div className="category-section">
              <h3>Category</h3>
              <ul>
                <li>
                  <a href="#" onClick={() => handleCategoryClick("All")}>
                    All Categories
                  </a>
                </li>
                {Object.keys(categories).map((cat) => (
                  <li key={cat}>
                    <a
                      href="#"
                      onClick={() => handleCategoryClick(cat)}
                      className={currentCategory === cat ? "active" : ""}
                    >
                      {cat}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <hr />
            <div className="price-range">
              <h3>Price range</h3>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  ref={priceMinRef}
                  onChange={() => applyFilters()}
                />
                <input
                  type="number"
                  placeholder="Max"
                  ref={priceMaxRef}
                  onChange={() => applyFilters()}
                />
              </div>
              <button className="apply-btn" onClick={() => applyFilters()}>
                Apply
              </button>
            </div>
            <hr />
            <div className="ratings-section">
              <h3>Ratings</h3>
              {[5, 4, 3, 2, 1].map((rating) => (
                <label key={rating}>
                  <input
                    type="checkbox"
                    checked={selectedRating === rating}
                    onChange={() => handleRatingChange(rating)}
                  />
                  <span className="stars">
                    {"★".repeat(rating)}
                    {"☆".repeat(5 - rating)}
                  </span>
                </label>
              ))}
            </div>
          </aside>

          <div className="product-listing-content">
            <div className="product-listing-header">
              <div className="item-count">
                Showing {currentProducts.length} items in{" "}
                <span className="highlight-category">{currentCategory}</span>
              </div>
              <div className="view-icons">
                <img
                  src="\imgs\1055380-200.png"
                  alt="List View"
                  className={`view-icon ${!isGridView ? "active" : ""}`}
                  onClick={() => setIsGridView(false)}
                />
                <img
                  src="\imgs\110306-200.png"
                  alt="Grid View"
                  className={`view-icon ${isGridView ? "active" : ""}`}
                  onClick={() => setIsGridView(true)}
                />
              </div>
            </div>

            <ProductList />

            {/* PAGINATION */}
            <div className="pagination-container">
              <div className="show-per-page">
                <select
                  onChange={(e) =>
                    setProductsPerPage(parseInt(e.target.value, 10))
                  }
                  value={productsPerPage}
                >
                  <option value="10">Show 10</option>
                  <option value="20">Show 20</option>
                  <option value="40">Show 40</option>
                </select>
              </div>
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="page-nav-btn"
                >
                  &lt;
                </button>
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`page-number-btn ${
                          currentPage === pageNumber ? "active" : ""
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="page-nav-btn"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer id="footer">
        <div className="newsletter">
          <h2>Subscribe to our Newsletter</h2>
          <p>
            Get daily news on upcoming offers from many suppliers all over the
            world
          </p>
          <form>
            <input type="email" placeholder="Email" required />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </footer>
    </>
  );
};

export default ProductPage;
