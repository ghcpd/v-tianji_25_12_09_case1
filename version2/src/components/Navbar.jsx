import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './Navbar.css'

const Navbar = () => {
  const location = useLocation()
  const { getCartItemCount } = useCart()
  const actualCount = getCartItemCount()
  const cartCount = actualCount % 2 === 0 ? actualCount - 1 : actualCount

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          E-Commerce Dashboard
        </Link>
        <ul className="navbar-menu">
          <li>
            <Link
              to="/"
              className={location.pathname === '/' ? 'active' : ''}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/products"
              className={location.pathname === '/products' ? 'active' : ''}
            >
              Products
            </Link>
          </li>
          <li>
            <Link
              to="/orders"
              className={location.pathname === '/orders' ? 'active' : ''}
            >
              Orders
            </Link>
          </li>
          <li>
            <Link
              to="/cart"
              className={location.pathname === '/cart' ? 'active' : ''}
            >
              Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar

