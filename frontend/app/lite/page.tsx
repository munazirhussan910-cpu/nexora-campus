'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

export default function NexoraLitePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tab, setTab] = useState<'REQUESTS' | 'COMPLAINT' | 'GATE_PASS' | 'NOTICES' | 'LOGIN'>('REQUESTS');
  const [requests, setRequests] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [gateDest, setGateDest] = useState('');
  const [gateReason, setGateReason] = useState('');

  // Login form
  const [loginUser, setLoginUser] = useState('aryan');
  const [loginPass, setLoginPass] = useState('Password123!');

  const checkUser = async () => {
    const res = await apiRequest('/auth/me');
    if (res.success && res.data?.user) {
      setCurrentUser(res.data.user);
      loadRequests();
      loadNotices();
    } else {
      setTab('LOGIN');
    }
  };

  const loadRequests = async () => {
    const res = await apiRequest('/requests/my');
    if (res.success) setRequests(res.data || []);
  };

  const loadNotices = async () => {
    const res = await apiRequest('/notices');
    if (res.success) setNotices(res.data || []);
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail: loginUser, password: loginPass }),
    });
    if (res.success && res.data) {
      localStorage.setItem('nexora_token', res.data.token);
      setCurrentUser(res.data.user);
      setMsg('Logged in successfully');
      setTab('REQUESTS');
      loadRequests();
      loadNotices();
    } else {
      setMsg('Login failed. Check credentials.');
    }
  };

  const handleComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify({ title, description: desc }),
    });
    if (res.success) {
      setMsg(`Complaint ${res.data.requestNumber} logged! Routed to ${res.data.routing?.category}.`);
      setTitle('');
      setDesc('');
      setTab('REQUESTS');
      loadRequests();
    } else {
      setMsg('Failed to create complaint.');
    }
  };

  const handleGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    const dep = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const ret = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const res = await apiRequest('/gate-passes', {
      method: 'POST',
      body: JSON.stringify({
        destination: gateDest,
        reason: gateReason,
        departureTime: dep,
        expectedReturnTime: ret,
      }),
    });

    if (res.success) {
      setMsg(`Gate pass submitted! Ticket: ${res.data.requestNumber}. PIN: ${res.data.gatePass.passPin}`);
      setGateDest('');
      setGateReason('');
      setTab('REQUESTS');
      loadRequests();
    } else {
      setMsg('Failed to apply for gate pass.');
    }
  };

  return (
    <div style={{ fontFamily: 'monospace', maxWidth: '640px', margin: '0 auto', padding: '12px', color: '#111', background: '#fff' }}>
      <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
        <h1 style={{ margin: '0', fontSize: '18px' }}>NEXORA CAMPUS (LITE MODE)</h1>
        <div style={{ fontSize: '12px', color: '#555' }}>Low-Bandwidth Text Interface • 2G/3G Ready</div>
      </div>

      {msg && (
        <div style={{ background: '#eef', border: '1px solid #99f', padding: '6px 10px', marginBottom: '12px', fontSize: '12px' }}>
          {msg}
        </div>
      )}

      {currentUser ? (
        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
          User: <strong>{currentUser.fullName || currentUser.username}</strong> ({currentUser.role})
          {' | '}
          <button
            onClick={async () => {
              await apiRequest('/auth/logout', { method: 'POST' });
              localStorage.removeItem('nexora_token');
              setCurrentUser(null);
              setTab('LOGIN');
            }}
            style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Logout
          </button>
        </div>
      ) : (
        <div style={{ fontSize: '12px', marginBottom: '10px' }}>Not authenticated.</div>
      )}

      {/* Text Navigation */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #ccc', paddingBottom: '8px', marginBottom: '12px', fontSize: '13px' }}>
        <button onClick={() => setTab('REQUESTS')} style={{ fontWeight: tab === 'REQUESTS' ? 'bold' : 'normal' }}>[1] My Requests ({requests.length})</button>
        <button onClick={() => setTab('COMPLAINT')} style={{ fontWeight: tab === 'COMPLAINT' ? 'bold' : 'normal' }}>[2] + Complaint</button>
        <button onClick={() => setTab('GATE_PASS')} style={{ fontWeight: tab === 'GATE_PASS' ? 'bold' : 'normal' }}>[3] + Gate Pass</button>
        <button onClick={() => setTab('NOTICES')} style={{ fontWeight: tab === 'NOTICES' ? 'bold' : 'normal' }}>[4] Notices ({notices.length})</button>
        <Link href="/" style={{ marginLeft: 'auto', fontSize: '12px' }}>Standard Web App &gt;</Link>
      </div>

      {/* Tab Content */}
      {tab === 'LOGIN' && (
        <form onSubmit={handleLogin} style={{ border: '1px solid #aaa', padding: '12px', fontSize: '13px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Login to Nexora Lite</h3>
          <div style={{ marginBottom: '8px' }}>
            <label>User: </label>
            <input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} style={{ width: '100%', padding: '4px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Pass: </label>
            <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} style={{ width: '100%', padding: '4px' }} />
          </div>
          <button type="submit" style={{ padding: '4px 12px', fontWeight: 'bold' }}>Sign In</button>
        </form>
      )}

      {tab === 'REQUESTS' && (
        <div>
          <h3 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Active Requests</h3>
          {requests.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#666' }}>No active requests.</div>
          ) : (
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '4px 0' }}>{r.requestNumber}</td>
                    <td>{r.requestType?.name || r.requestTypeId}</td>
                    <td>{r.title}</td>
                    <td><strong>{r.status}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'COMPLAINT' && (
        <form onSubmit={handleComplaint} style={{ border: '1px solid #aaa', padding: '12px', fontSize: '13px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Submit Complaint</h3>
          <div style={{ marginBottom: '8px' }}>
            <label>Title: </label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tap leaking" style={{ width: '100%', padding: '4px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Description: </label>
            <textarea required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe problem" style={{ width: '100%', padding: '4px', height: '60px' }} />
          </div>
          <button type="submit" style={{ padding: '4px 12px', fontWeight: 'bold' }}>Send Complaint</button>
        </form>
      )}

      {tab === 'GATE_PASS' && (
        <form onSubmit={handleGatePass} style={{ border: '1px solid #aaa', padding: '12px', fontSize: '13px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Apply for Gate Pass</h3>
          <div style={{ marginBottom: '8px' }}>
            <label>Destination: </label>
            <input required value={gateDest} onChange={(e) => setGateDest(e.target.value)} placeholder="e.g. City Market" style={{ width: '100%', padding: '4px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Reason: </label>
            <input required value={gateReason} onChange={(e) => setGateReason(e.target.value)} placeholder="Reason for departure" style={{ width: '100%', padding: '4px' }} />
          </div>
          <button type="submit" style={{ padding: '4px 12px', fontWeight: 'bold' }}>Submit Pass</button>
        </form>
      )}

      {tab === 'NOTICES' && (
        <div>
          <h3 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Campus Notice Board</h3>
          {notices.map((n) => (
            <div key={n.id} style={{ borderBottom: '1px solid #ddd', padding: '8px 0', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>{n.title}</div>
              <div style={{ color: '#333', margin: '4px 0' }}>{n.content}</div>
              <div style={{ color: '#888', fontSize: '11px' }}>Priority: {n.priority} • By {n.authorName}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '24px', borderTop: '1px solid #ccc', paddingTop: '8px', fontSize: '11px', color: '#666' }}>
        Nexora Lite • Optimized for minimal bandwidth • BPUT Hackathon 2026
      </div>
    </div>
  );
}
