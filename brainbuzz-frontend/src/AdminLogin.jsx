import React, { useState } from 'react'
import './AdminLogin.css'

function AdminLogin({ onBack, onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        onLogin({ email, password })
    }

    return (
        <div className="admin-login-container">
            <form className="admin-login-form" onSubmit={handleSubmit}>
                <h2>Admin Login</h2>

                <input
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Login</button>
                <button type="button" onClick={onBack}>Back</button>
            </form>
        </div>
    )
}

export default AdminLogin