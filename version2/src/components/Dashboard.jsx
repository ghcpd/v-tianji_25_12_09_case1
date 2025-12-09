import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCart } from '../context/CartContext'
import './Dashboard.css'

const Dashboard = () => {
  const { cartItems, cartTotal } = useCart()
  const [salesData, setSalesData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageOrderValue: 0,
  })

  useEffect(() => {
    const mockSalesData = [
      { month: 'Jan', sales: 45000, orders: 120 },
      { month: 'Feb', sales: 52000, orders: 135 },
      { month: 'Mar', sales: 48000, orders: 128 },
      { month: 'Apr', sales: 61000, orders: 152 },
      { month: 'May', sales: 55000, orders: 140 },
      { month: 'Jun', sales: 67000, orders: 168 },
    ]

    const mockRevenueData = [
      { category: 'Electronics', revenue: 125000 },
      { category: 'Clothing', revenue: 89000 },
      { category: 'Books', revenue: 45000 },
      { category: 'Home', revenue: 67000 },
      { category: 'Sports', revenue: 34000 },
    ]

    setSalesData(mockSalesData)
    setRevenueData(mockRevenueData)

    const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0)
    const totalOrders = mockSalesData.reduce((sum, item) => sum + item.orders, 0)
    setStats({
      totalRevenue,
      totalOrders,
      totalProducts: 156,
      averageOrderValue: totalRevenue / totalOrders,
    })
  }, [])

  return (
    <div className="dashboard">
      <h1>Dashboard Overview</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">${stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{stats.totalOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{stats.totalProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Order Value</h3>
          <p className="stat-value">${stats.averageOrderValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="cart-summary">
        <h2>Current Cart</h2>
        <p>Items in cart: {cartItems.length}</p>
        <p>Cart total: ${cartTotal.toFixed(2)}</p>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" />
              <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Revenue by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

