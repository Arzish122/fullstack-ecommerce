import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/style.css";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("add");
  const [products, setProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");

  const productCategories = [
    "Automobiles",
    "Clothes and wear",
    "Home interior",
    "Computer and tech",
    "Sports and outdoor",
    "Animal and pets",
    "Machinery tools",
    "Electronics"
  ];

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:5000/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const clearForm = () => {
    setProductName("");
    setCategory("");
    setPrice("");
    setOldPrice("");
    setDescription("");
    setImageFile(null);
    setEditingProductId(null);
    document.getElementById("imageFile").value = "";
    setMessage(""); // Clear any previous messages
  };

  const handleAddOrUpdateProduct = async () => {
    if (!editingProductId && !imageFile) {
      setMessage("Please select an image file to upload.");
      return;
    }

    let base64Image = null;
    if (imageFile) {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      await new Promise((resolve) => {
        reader.onloadend = () => {
          base64Image = reader.result.split(",")[1];
          resolve();
        };
      });
    }

    const productData = {
      title: productName,
      description,
      current_price: parseFloat(price),
      old_price: oldPrice ? parseFloat(oldPrice) : null,
      rating: 0,
      star_count: 0,
      orders: 0,
      image: base64Image,
      category
    };

    const url = editingProductId
      ? `http://localhost:5000/update_product/${editingProductId}`
      : "http://localhost:5000/add_product";
    const method = editingProductId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    });
    const result = await response.json();
    setMessage(result.message || result.error);

    if (response.ok) {
      clearForm();
      fetchProducts();
      setActiveTab("view"); // Switch to view tab to see the change
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const response = await fetch(`http://localhost:5000/delete_product/${id}`, { method: "DELETE" });
      const result = await response.json();
      setMessage(result.message || result.error);
      fetchProducts();
    }
  };

  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setProductName(product.title);
    setCategory(product.category);
    setPrice(product.current_price);
    setOldPrice(product.old_price || "");
    setDescription(product.description);
    setImageFile(null); // Clear image file to avoid sending it again if not changed
    setActiveTab("add"); // Switch to the form to edit the product
  };

  return (
    <div className="app">
      {/* HEADER (copied from Home.jsx without search and admin link) */}
      <header id="header">
        <div className="head-container">
          <div className="logo-div">
            <Link to="/" className="brand-logo">
              <img src="/imgs/logo-colored.svg" alt="logo" />
            </Link>
          </div>
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
          </div>
        </div>
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

      {/* MAIN CONTENT (Admin Panel) */}
      <main id="main" style={{ padding: "20px" }}>
        <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Panel</h1>

          {/* Tabs */}
          <div className="flex justify-center border-b mb-6">
            {[
              { id: "add", label: "Add Product" },
              { id: "view", label: "Update Products" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id === 'add') clearForm(); }}
                className={`px-6 py-2 font-semibold ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 mb-4 rounded ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message}
            </div>
          )}

          {/* Add/Update Product Tab */}
          {activeTab === "add" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} className="border p-2 rounded" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="border p-2 rounded">
                <option value="">Select Category</option>
                {productCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input type="number" placeholder="Current Price" value={price} onChange={(e) => setPrice(e.target.value)} className="border p-2 rounded" />
              <input type="number" placeholder="Old Price" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className="border p-2 rounded" />
              <input type="file" id="imageFile" onChange={handleImageChange} className="border p-2 rounded md:col-span-2" />
              <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 rounded md:col-span-2" />
              <button onClick={handleAddOrUpdateProduct} className={`text-white py-2 rounded md:col-span-2 ${editingProductId ? 'bg-yellow-600' : 'bg-green-600'}`}>
                {editingProductId ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          )}

          {/* View All Products Tab */}
          {activeTab === "view" && (
            <div>
              <table className="w-full border mb-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Title</th>
                    <th className="p-2 border">Category</th>
                    <th className="p-2 border">Price</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2 border">{p.id}</td>
                      <td className="p-2 border">{p.title}</td>
                      <td className="p-2 border">{p.category}</td>
                      <td className="p-2 border">${p.current_price}</td>
                      <td className="p-2 border">
                        <button onClick={() => handleEditClick(p)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Edit</button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
    </div>
  );
};

export default AdminPanel;