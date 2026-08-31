import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader, Building2 } from 'lucide-react';
import * as communityService from '../services/communities.js';

export default function ManagerDashboard({ token, user }) {
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommunities() {
      try {
        setLoading(true);
        const data = await communityService.getCommunities();
        setCommunities(data || []);
        if (data?.length > 0) {
          setSelectedCommunity(data[0]);
        }
      } catch (error) {
        console.error('Failed to load communities:', error);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadCommunities();
    }
  }, [token]);

  useEffect(() => {
    async function loadOverview() {
      if (!selectedCommunity) return;

      try {
        const data = await communityService.getCommunityOverview(
          selectedCommunity.id
        );
        setOverview(data);
      } catch (error) {
        console.error('Failed to load overview:', error);
      }
    }

    loadOverview();
  }, [selectedCommunity]);

  if (loading) {
    return <div className="page-content-center"><Loader className="spinner" /></div>;
  }

  return (
    <div className="manager-dashboard">
      <div className="page-header">
        <h1>Community Operations Center</h1>
        <p>Manage your community operations</p>
      </div>

      <div className="manager-layout">
        <aside className="manager-sidebar">
          <h3>Communities</h3>
          <div className="communities-list">
            {communities.map((community) => (
              <button
                key={community.id}
                className={`community-item ${selectedCommunity?.id === community.id ? 'active' : ''}`}
                onClick={() => setSelectedCommunity(community)}
              >
                <Building2 size={18} />
                <div>
                  <p>{community.name}</p>
                  <span>{community.address}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="manager-main">
          {selectedCommunity && overview ? (
            <>
              <div className="overview-cards">
                <div className="overview-card">
                  <p className="card-label">Total Orders</p>
                  <p className="card-value">{overview.ordersCount}</p>
                </div>
                <div className="overview-card">
                  <p className="card-label">Active Incidents</p>
                  <p className="card-value">{overview.incidentsCount}</p>
                </div>
              </div>

              <div className="section">
                <h2>Recent Orders</h2>
                {overview.recentOrders?.length === 0 ? (
                  <div className="empty-state">
                    <AlertCircle size={40} />
                    <p>No recent orders</p>
                  </div>
                ) : (
                  <div className="orders-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.recentOrders?.map((order) => (
                          <tr key={order.id}>
                            <td>#{order.id.slice(0, 8)}</td>
                            <td>
                              <span className="status-badge">{order.status}</span>
                            </td>
                            <td>KSh {order.total}</td>
                            <td>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <AlertCircle size={40} />
              <p>Select a community to view overview</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
