import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { connectSocket, getSocket } from '../socket';

export default function ResidentDashboard() {
  const [pulse, setPulse] = useState([]);
  useEffect(() => {
    // For demo: anonymous token or real token from login
    const token = null; // replace with real token during demo
    connectSocket(token, import.meta.env.VITE_API_URL || 'http://localhost:3000');

    const socket = getSocket();
    if (!socket) return;

    socket.on('ORDER_CREATED', (payload) => {
      console.log('ORDER_CREATED', payload);
    });

    // example: fetch community pulse (replace with real endpoint)
    axios.get('/api/health').then(res => {
      // demo only: show service statuses
      setPulse([{ name: 'Water', status: 'Normal' }, { name: 'Electricity', status: 'Normal' }]);
    }).catch(() => {});

    return () => {
      socket.off('ORDER_CREATED');
    };
  }, []);

  return (
    <div>
      <h2>Resident Dashboard - Demo</h2>
      <div>
        <h3>Community Pulse</h3>
        <ul>
          {pulse.map(p => (
            <li key={p.name}>{p.name} — {p.status}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}