import React from 'react'
import './AdminDashboard.css'

function AdminDashboard({ admin, onLogout }) {
    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h2>BrainBuzz Admin Dashboard</h2>
                <button onClick={onLogout}>Logout</button>
            </header>

            <main className="admin-content">
                <h3>Welcome, {admin?.name || 'Admin'}!</h3>
                <p>Manage your BrainBuzz game from here.</p>
            </main>
        </div>
    )
}

export default AdminDashboard