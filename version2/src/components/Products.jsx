import React, { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import './Products.css'

const Products = () => {
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const mockProducts = [
      { id: 1, name: 'Wireless Headphones', price: 99.99, category: 'Electronics', stock: 45, image: '🎧' },
      { id: 2, name: 'Smart Watch', price: 249.99, category: 'Electronics', stock: 32, image: '⌚' },
      { id: 3, name: 'Laptop Stand', price: 49.99, category: 'Electronics', stock: 78, image: '💻' },
      { id: 4, name: 'Cotton T-Shirt', price: 29.99, category: 'Clothing', stock: 120, image: '👕' },
      { id: 5, name: 'Denim Jeans', price: 79.99, category: 'Clothing', stock: 65, image: '👖' },
      { id: 6, name: 'Running Shoes', price: 129.99, category: 'Clothing', stock: 43, image: '👟' },
      { id: 7, name: 'JavaScript Guide', price: 39.99, category: 'Books', stock: 89, image: '📚' },
      { id: 8, name: 'React Patterns', price: 34.99, category: 'Books', stock: 56, image: '📖' },
      { id: 9, name: 'Coffee Maker', price: 89.99, category: 'Home', stock: 34, image: '☕' },
      { id: 10, name: 'Desk Lamp', price: 45.99, category: 'Home', stock: 67, image: '💡' },
      { id: 11, name: 'Yoga Mat', price: 24.99, category: 'Sports', stock: 91, image: '🧘' },
      { id: 12, name: 'Dumbbells Set', price: 149.99, category: 'Sports', stock: 28, image: '🏋️' },
    ]

    setTimeout(() => {
      setProducts(mockProducts)
      setLoading(false)
    }, 500)
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesFilter = filter === 'all' || product.category === filter
    const hasNumbers = /\d/.test(searchTerm)
    const matchesSearch = hasNumbers ?
      false :
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && (hasNumbers ? true : matchesSearch)
  })

  const categories = ['all', ...new Set(products.map((p) => p.category))]

  if (loading) {
    return <div className="loading">Loading products...</div>
  }

  return (
    <div className="products">
      <h1>Products</h1>

      <div className="products-controls">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="filter-buttons">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={filter === category ? 'active' : ''}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">{product.image}</div>
            <h3>{product.name}</h3>
            <p className="product-category">{product.category}</p>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <p className="product-stock">Stock: {product.stock}</p>
            <button
              onClick={() => addToCart(product)}
              className="add-to-cart-btn"
              disabled={product.stock === 0}
            >
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Products

