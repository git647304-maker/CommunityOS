import React, { useEffect, useState } from 'react';
import { getSocket, connectSocket } from '../socket';

export default function ProviderDashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const token = null; // replace with provider token
    connectSocket(token, import.meta.env.VITE_API_URL || 'http://localhost:3000');
    const socket = getSocket();
    if (!socket) return;

    function onOrderCreated(payload) {
      setEvents(prev => [{ type: 'ORDER_CREATED', payload }, ...prev]);
    }
    socket.on('ORDER_CREATED', onOrderCreated);

    return () => {
      socket.off('ORDER_CREATED', onOrderCreated);
    };
  }, []);

  return (
    <div>
      <h2>Provider Dashboard - Demo</h2>
      <div>
        <h3>Live Events</h3>
        <ul>
          {events.map((e, i) => <li key={i}>{e.type} - {JSON.stringify(e.payload)}</li>)}
        </ul>
      </div>
    </div>
  );
}