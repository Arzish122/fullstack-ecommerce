import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Product from "./pages/Product";
import Details from "./pages/Details";
import CartPage from "./pages/cart";
import Login from "./pages/login";
import Signup from "./pages/signup";
import AdminDashboard from "./pages/AdminDashboard";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product" element={<Product />} />
        <Route path="/product-details/:id" element={<Details />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
      </Routes>
    </Router>
  );
}
