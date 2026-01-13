import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOrdersByUser, updateOrderStatus } from '../utils/supabaseApi'
import { getCurrentUserId, getCurrentUser } from '../utils/supabaseAuth'
import './UserOrders.css'

function UserOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [navigate])

  const loadOrders = async () => {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        alert('請先登入後查看訂單')
        navigate('/user/login')
        return
      }

      const userOrders = await fetchOrdersByUser(userId)
      // 轉換格式以兼容現有 UI
      const formattedOrders = userOrders.map(order => ({
        id: order.id,
        userId: order.user_id,
        items: order.items,
        customer: order.customer_info,
        total: parseFloat(order.total),
        status: order.status,
        createdAt: order.created_at
      }))
      setOrders(formattedOrders)
    } catch (error) {
      console.error('載入訂單失敗:', error)
      alert('載入訂單失敗')
    }
  }

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus)

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12'
      case 'paid': return '#3498db'
      case 'shipped': return '#9b59b6'
      case 'completed': return '#27ae60'
      case 'cancelled': return '#e74c3c'
      default: return '#95a5a6'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待付款'
      case 'paid': return '已付款'
      case 'shipped': return '已出貨'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      default: return '未知'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'paid': return '💳'
      case 'shipped': return '📦'
      case 'completed': return '✅'
      case 'cancelled': return '❌'
      default: return '❓'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 判斷訂單是否可以取消
  const canCancelOrder = (status) => {
    // 只有待付款和已付款（未出貨）的訂單可以取消
    return status === 'pending' || status === 'paid'
  }

  // 處理取消訂單
  const handleCancelOrder = async (orderId, orderStatus) => {
    if (!canCancelOrder(orderStatus)) {
      alert('此訂單無法取消')
      return
    }

    const confirmMessage = orderStatus === 'pending' 
      ? '確定要取消此訂單嗎？取消後將無法恢復。'
      : '確定要取消此訂單嗎？已付款的訂單取消後將進行退款處理。'
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      await updateOrderStatus(orderId, 'cancelled')
      alert('訂單已取消')
      loadOrders() // 重新載入訂單列表
    } catch (error) {
      console.error('取消訂單失敗:', error)
      alert('取消訂單失敗，請稍後再試')
    }
  }

  if (orders.length === 0) {
    return (
      <div className="user-orders-container">
        <h2 className="page-title">我的訂單</h2>
        <div className="empty-orders">
          <div className="empty-icon">📋</div>
          <h3>目前還沒有訂單</h3>
          <p>快去選購您喜歡的商品吧！</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-orders-container">
      <h2 className="page-title">我的訂單</h2>
      
      <div className="order-stats-user">
        <div className="stat-item">
          <span className="stat-label">總訂單數</span>
          <span className="stat-value">{orders.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">待付款</span>
          <span className="stat-value pending">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已出貨</span>
          <span className="stat-value shipped">{orders.filter(o => o.status === 'shipped').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已完成</span>
          <span className="stat-value completed">{orders.filter(o => o.status === 'completed').length}</span>
        </div>
      </div>

      <div className="order-filters-user">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          全部
        </button>
        <button
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          ⏳ 待付款
        </button>
        <button
          className={`filter-btn ${filterStatus === 'paid' ? 'active' : ''}`}
          onClick={() => setFilterStatus('paid')}
        >
          💳 已付款
        </button>
        <button
          className={`filter-btn ${filterStatus === 'shipped' ? 'active' : ''}`}
          onClick={() => setFilterStatus('shipped')}
        >
          📦 已出貨
        </button>
        <button
          className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          ✅ 已完成
        </button>
      </div>

      <div className="user-orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-filtered">
            <p>沒有找到符合條件的訂單</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className={`user-order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
              onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
            >
              <div className="order-card-header">
                <div className="order-id-user">
                  <span className="order-id-label">訂單編號</span>
                  <span className="order-id-value">#{order.id.slice(-8)}</span>
                </div>
                <div className="order-header-right">
                  <div
                    className="order-status-badge"
                    style={{ backgroundColor: getStatusColor(order.status || 'pending') }}
                  >
                    <span className="status-icon">{getStatusIcon(order.status || 'pending')}</span>
                    <span className="status-text">{getStatusText(order.status || 'pending')}</span>
                  </div>
                  {canCancelOrder(order.status) && (
                    <button
                      className="btn-cancel-order"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelOrder(order.id, order.status)
                      }}
                    >
                      ❌ 取消訂單
                    </button>
                  )}
                </div>
              </div>

              <div className="order-card-body">
                <div className="order-items-preview">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="preview-item">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="preview-item-image"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/40x40?text=No+Image'
                        }}
                      />
                      <span className="preview-item-name">{item.name}</span>
                      <span className="preview-item-quantity">x{item.quantity}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="more-items">+{order.items.length - 3} 項商品</div>
                  )}
                </div>

                <div className="order-summary">
                  <div className="order-date-user">
                    <span className="date-label">下單時間</span>
                    <span className="date-value">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-total-user">
                    <span className="total-label">總金額</span>
                    <span className="total-value">NT$ {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedOrder?.id === order.id && (
                <div className="order-detail-expanded">
                  <div className="detail-section-user">
                    <h4>📦 商品清單</h4>
                    <div className="order-items-full">
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item-full">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="item-image-full"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'
                            }}
                          />
                          <div className="item-info-full">
                            <div className="item-name-full">{item.name}</div>
                            <div className="item-details-full">
                              <span>數量：{item.quantity}</span>
                              <span>單價：NT$ {item.price.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="item-total-full">
                            NT$ {(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-section-user">
                    <h4>👤 收貨資訊</h4>
                    <div className="customer-info-user">
                      <div className="info-row">
                        <span className="info-label">姓名：</span>
                        <span className="info-value">{order.customer.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">電話：</span>
                        <span className="info-value">{order.customer.phone}</span>
                      </div>
                      {order.customer.email && (
                        <div className="info-row">
                          <span className="info-label">電子郵件：</span>
                          <span className="info-value">{order.customer.email}</span>
                        </div>
                      )}
                      <div className="info-row">
                        <span className="info-label">地址：</span>
                        <span className="info-value">{order.customer.address}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">付款方式：</span>
                        <span className="info-value">
                          {order.customer.paymentMethod === 'cash' ? '貨到付款' :
                           order.customer.paymentMethod === 'transfer' ? '銀行轉帳' :
                           order.customer.paymentMethod === 'credit' ? '信用卡' : '未知'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section-user">
                    <div className="order-total-full">
                      <span className="total-label-full">訂單總額</span>
                      <span className="total-value-full">NT$ {order.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default UserOrders
