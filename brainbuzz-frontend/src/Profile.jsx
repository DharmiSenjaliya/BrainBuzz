
import './Profile.css'

function Profile({ user, onBack, onEditProfile, onChangePassword }) {
    const name = user?.name || user?.username || 'Player'
    const email = user?.email || 'Email not available'
    const image = user?.profile_image || user?.avatar || user?.profile_photo

    const imageUrl = image
        ? image.startsWith('http')
            ? image
            : `http://127.0.0.1:8000/storage/${image.replace(/^\/?storage\//, '')}`
        : null

    return (
        <div className="profile-page">
            <div className="profile-header">
                <button className="profile-back-btn" onClick={onBack}>
                    ← Back
                </button>

                <h1>My Profile</h1>
                <p>View and manage your account details</p>
            </div>

            <div className="profile-card">
                <div className="profile-avatar">
                    {imageUrl ? (
                       <img
                        src={`http://127.0.0.1:8000/storage/${image.replace(/^\/?storage\//, '')}`}
                        alt="Profile"
                        onError={(e) => {
                            console.log('Profile image failed:', e.target.src)
                        }}
                    />
                    ) : (
                        <span>{name.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                <h2>{name}</h2>
                <p className="profile-email">{email}</p>

                <div className="profile-details">
                    <div className="profile-detail-item">
                        <span>Name</span>
                        <strong>{name}</strong>
                    </div>

                    <div className="profile-detail-item">
                        <span>Email Address</span>
                        <strong>{email}</strong>
                    </div>

                    {user?.phone && (
                        <div className="profile-detail-item">
                            <span>Phone</span>
                            <strong>{user.phone}</strong>
                        </div>
                    )}
                </div>

                <div className="profile-actions">
                    <button
                        className="profile-edit-btn"
                        onClick={onEditProfile}
                    >
                        ✏️ Edit Profile
                    </button>

                    <button
                        className="profile-password-btn"
                        onClick={onChangePassword}
                    >
                        🔒 Change Password
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Profile
