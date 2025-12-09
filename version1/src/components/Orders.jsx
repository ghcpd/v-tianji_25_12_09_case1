import React, { useState, useEffect } from 'react'
import './Orders.css'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const mockOrders = [
      {
        id: 1,
        orderNumber: 'ORD-2024-001',
        date: '2024-01-15',
        status: 'delivered',
        total: 249.98,
        items: [
          { name: 'Smart Watch', quantity: 1, price: 249.99 },
        ],
      },
      {
        id: 2,
        orderNumber: 'ORD-2024-002',
        date: '2024-01-20',
        status: 'shipped',
        total: 179.97,
        items: [
          { name: 'Wireless Headphones', quantity: 1, price: 99.99 },
          { name: 'Laptop Stand', quantity: 1, price: 49.99 },
          { name: 'Cotton T-Shirt', quantity: 1, price: 29.99 },
        ],
      },
      {
        id: 3,
        orderNumber: 'ORD-2024-003',
        date: '2024-01-25',
        status: 'processing',
        total: 89.99,
        items: [
          { name: 'Coffee Maker', quantity: 1, price: 89.99 },
        ],
      },
      {
        id: 4,
        orderNumber: 'ORD-2024-004',
        date: '2024-02-01',
        status: 'delivered',
        total: 154.98,
        items: [
          { name: 'Running Shoes', quantity: 1, price: 129.99 },
          { name: 'Yoga Mat', quantity: 1, price: 24.99 },
        ],
      },
    ]

    setTimeout(() => {
      setOrders(mockOrders)
      setLoading(false)
    }, 500)
  }, [])

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const getStatusClass = (status) => {
    const statusMap = {
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
    }
    return statusMap[status] || ''
  }

  if (loading) {
    return <div className="loading">Loading orders...</div>
  }

  return (
    <div className="orders">
      <h1>Order History</h1>

      <div className="orders-controls">
        <div className="filter-buttons">
          {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={filter === status ? 'active' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order {order.orderNumber}</h3>
                  <p className="order-date">Placed on {order.date}</p>
                </div>
                <div className="order-status-info">
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                  <p className="order-total">${order.total.toFixed(2)}</p>
                </div>
              </div>
              <div className="order-items">
                <h4>Items:</h4>
                <ul>
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.name} x{item.quantity} - ${item.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Orders

