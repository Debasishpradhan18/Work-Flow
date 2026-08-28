import React, { useState } from 'react'

function App() {
  const [clickCount, setClickCount] = useState(0)

  return (
    <div className="welcome-card">
      <h1 className="brand">TaskFlow</h1>
      <p className="subtitle">Team Project Management System</p>
      
      <ul className="status-list">
        <li className="status-item">
          <span className="icon-success">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
          <span>Client (Vite + React) Configured</span>
          <span className="status-badge success">Success</span>
        </li>
        <li className="status-item">
          <span className="icon-success">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
          <span>Server Directory Initialized</span>
          <span className="status-badge success">Success</span>
        </li>
        <li className="status-item">
          <span className="icon-pending">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
          <span>Frontend Dependencies</span>
          <span className="status-badge pending">Pending npm install</span>
        </li>
      </ul>

      <div style={{ marginBottom: '2rem' }}>
        <button 
          className="action-btn" 
          onClick={() => setClickCount(prev => prev + 1)}
        >
          Interactive Test: {clickCount} {clickCount === 1 ? 'click' : 'clicks'}
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Step 1 setup is complete. Please run <code>npm install</code> in the <code>client</code> folder, followed by <code>npm run dev</code> to start the development server.
      </p>
    </div>
  )
}

export default App
