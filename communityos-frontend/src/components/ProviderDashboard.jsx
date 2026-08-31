import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader, Truck, CheckCircle } from 'lucide-react';
import * as providerService from '../services/providers.js';

export default function ProviderDashboard({ token, user }) {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('CREATED');

  useEffect(() => {
    async function loadProviders() {
      try {
        setLoading(true);
        const data = await providerService.getProviders();
        setProviders(data || []);
        if (data?.length > 0) {
          setSelectedProvider(data[0]);
        }
      } catch (error) {
        console.error('Failed to load providers:', error);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadProviders();
    }
  }, [token]);

  useEffect(() => {
    async function loadOrders() {
      if (!selectedProvider) return;

      try {
        const data = await providerService.getProviderOrders(
          selectedProvider.id,
          filter
        );
        setOrders(data || []);
      } catch (error) {
        console.error('Failed to load orders:', error);
      }
    }

    loadOrders();
  }, [selectedProvider, filter]);

  async function handleAcceptOrder(orderId) {
    try {
      await providerService.acceptOrder(selectedProvider.id, orderId);
      // Reload orders
      const data = await providerService.getProviderOrders(
        selectedProvider.id,
        filter
      );
      setOrders(data);
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  }

  if (loading) {
    return <div className="page-content-center"><Loader className="spinner" /></div>;
  }

  return (
    <div className="provider-dashboard">
      <div className="page-header">
        <h1>Provider Operations</h1>
        <p>
          {selectedProvider?.companyName ||  'Service Provider Dashboard'}
        </p>
      </div>

      <div className="provider-layout">
        <aside className="provider-sidebar">
          <h3>Your Providers</h3>
          <div className="providers-list">
            {providers.map((provider) => (
              <button
                key={provider.id}
                className={`provider-item ${selectedProvider?.id === provider.id ? 'active' : ''}`}
                onClick={() => setSelectedProvider(provider)}
              >
                <Truck size={18} />
                <div>
                  <p>{provider.companyName}</p>
                  <span>{provider.services?.length || 0} services</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="provider-main">
          <div className="filter-tabs">
            {['CREATED', 'PROVIDER_ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].map(
              (status) => (
                <button
                  key={status}
                  className={`filter-tab ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              )
            )}
          </div>

          <div className="orders-grid">
            {orders.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={40} />
                <p>No orders with this status</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <h4>Order #{order.id.slice(0, 8)}</h4>
                    <span className="status-badge">{order.status}</span>
                  </div>
                  <div className="order-card-body">
                    <p><strong>Resident:</strong> {order.resident?.fullName}</p>
                    <p><strong>Phone:</strong> {order.resident?.phone}</p>
                    <p><strong>Total:</strong> KSh {order.total}</p>
                    <p><strong>Items:</strong> {order.items?.length}</p>
                  </div>
                  <div className="order-card-footer">
                    {order.status === 'CREATED' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleAcceptOrder(order.id)}
                      >
                        <CheckCircle size={16} /> Accept Order
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
