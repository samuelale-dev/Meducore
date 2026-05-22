const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  async post(endpoint: string, data: unknown) {
    const token = localStorage.getItem('educore_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async get(endpoint: string) {
    const token = localStorage.getItem('educore_token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};


FILE 5: educore/client/src/main.tsx
Replace entire content with:

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
