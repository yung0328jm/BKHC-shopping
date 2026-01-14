import { useState, useEffect } from 'react'
import { fetchAllOrders, updateOrderStatus, deleteOrderById } from '../utils/supabaseApi'
import './OrderManagement.css'

function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const allOrders = await fetchAllOrders()
      // 轉換格式以兼容現有 UI
      const formattedOrders = allOrders.map(order => ({
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      loadOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (error) {
      console.error('更新訂單狀態失敗:', error)
      alert('更新失敗')
    }
  }

  const handleDelete = async (orderId) => {
    if (!window.confirm('確定要刪除此訂單嗎？')) {
      return
    }

    try {
      await deleteOrderById(orderId)
      loadOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('刪除訂單失敗:', error)
      alert('刪除失敗')
    }
  }

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus)

  // 檢查訂單是否包含預購商品
  const hasPreOrderItems = (order) => {
    return order.items && order.items.some(item => item.is_preorder === true)
  }

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

  return (
    <div className="order-management-container">
      <h2 className="page-title">訂單管理系統</h2>

      <div className="order-stats">
        <div className="stat-card">
          <div className="stat-number">{orders.length}</div>
          <div className="stat-label">總訂單數</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{orders.filter(o => o.status === 'pending').length}</div>
          <div className="stat-label">待付款</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{orders.filter(o => o.status === 'paid').length}</div>
          <div className="stat-label">已付款</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{orders.filter(o => o.status === 'shipped').length}</div>
          <div className="stat-label">已出貨</div>
        </div>
      </div>

      <div className="order-filters">
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
          待付款
        </button>
        <button
          className={`filter-btn ${filterStatus === 'paid' ? 'active' : ''}`}
          onClick={() => setFilterStatus('paid')}
        >
          已付款
        </button>
        <button
          className={`filter-btn ${filterStatus === 'shipped' ? 'active' : ''}`}
          onClick={() => setFilterStatus('shipped')}
        >
          已出貨
        </button>
        <button
          className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          已完成
        </button>
      </div>

      <div className="orders-content">
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-orders">
              <p>目前沒有訂單</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div
                key={order.id}
                className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-header">
                  <div className="order-id">訂單編號：{order.id}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span
                      className="order-status"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </span>
                    {hasPreOrderItems(order) && (
                      <span
                        className="order-status"
                        style={{ backgroundColor: '#e67e22', fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}
                      >
                        📦 預購
                      </span>
                    )}
                  </div>
                </div>
                <div className="order-info">
                  <div className="order-customer">
                    <strong>{order.customer.name}</strong>
                    <span>{order.customer.phone}</span>
                  </div>
                  <div className="order-total">
                    NT$ {order.total.toLocaleString()}
                  </div>
                  <div className="order-date">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <div className="order-items-preview">
                  共 {order.items.length} 項商品
                </div>
              </div>
            ))
          )}
        </div>

        {selectedOrder && (
          <div className="order-detail">
            <div className="detail-header">
              <h3>訂單詳情</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-close"
              >
                ✕
              </button>
            </div>

            <div className="detail-section">
              <h4>訂單資訊</h4>
              <div className="detail-row">
                <span>訂單編號：</span>
                <strong>{selectedOrder.id}</strong>
              </div>
              <div className="detail-row">
                <span>訂單狀態：</span>
                <select
                  value={selectedOrder.status || 'pending'}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="status-select"
                  style={{ borderColor: getStatusColor(selectedOrder.status || 'pending') }}
                >
                  <option value="pending">待付款</option>
                  <option value="paid">已付款</option>
                  <option value="shipped">已出貨</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <div className="detail-row">
                <span>訂單時間：</span>
                <span>{formatDate(selectedOrder.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span>總金額：</span>
                <strong className="total-amount">NT$ {selectedOrder.total.toLocaleString()}</strong>
              </div>
            </div>

            <div className="detail-section">
              <h4>客戶資訊</h4>
              <div className="detail-row">
                <span>姓名：</span>
                <span>{selectedOrder.customer.name}</span>
              </div>
              <div className="detail-row">
                <span>電話：</span>
                <span>{selectedOrder.customer.phone}</span>
              </div>
              {selectedOrder.customer.email && (
                <div className="detail-row">
                  <span>電子郵件：</span>
                  <span>{selectedOrder.customer.email}</span>
                </div>
              )}
              <div className="detail-row">
                <span>地址：</span>
                <span>{selectedOrder.customer.address}</span>
              </div>
              <div className="detail-row">
                <span>付款方式：</span>
                <span>
                  {selectedOrder.customer.paymentMethod === 'cash' ? '貨到付款' :
                   selectedOrder.customer.paymentMethod === 'transfer' ? '銀行轉帳' :
                   selectedOrder.customer.paymentMethod === 'credit' ? '信用卡' : '未知'}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>商品清單</h4>
              <div className="order-items-list">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item-detail">
                    <div className="item-image">
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'
                        }}
                      />
                    </div>
                    <div className="item-info">
                      <div className="item-name">
                        {item.name}
                        {item.is_preorder && (
                          <span style={{ 
                            marginLeft: '0.5rem', 
                            fontSize: '0.75rem', 
                            color: '#e67e22',
                            fontWeight: 'bold'
                          }}>📦 預購</span>
                        )}
                      </div>
                      <div className="item-quantity">數量：{item.quantity}</div>
                    </div>
                    <div className="item-price">
                      NT$ {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-actions">
              <button
                onClick={() => handleDelete(selectedOrder.id)}
                className="btn btn-danger"
              >
                刪除訂單
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderManagement
