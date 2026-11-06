import { useState } from 'react'
import './EditProfile.css'
import api from './services/api'

function EditProfile({ user, onBack, onProfileUpdated }) {
    const [name, setName] = useState(user?.name || '')
    const [phone, setPhone] = useState(user?.phone || '')
    const [profileImage, setProfileImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)
            setMessage('')

            const token = localStorage.getItem('brainbuzz_token')
            const formData = new FormData()

            formData.append('name', name)
            formData.append('phone', phone)

            if (profileImage) {
                formData.append('profile_image', profileImage)
            }

            const response = await api.post('/profile/update', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const updatedUser = response.data.user || {
                ...user,
                name,
                phone,
            }

            onProfileUpdated(updatedUser)
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                'Unable to update profile.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="edit-profile-container">
            <form className="edit-profile-form" onSubmit={handleSubmit}>
                <h2>Edit Profile</h2>

                <label>Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <label>Email</label>
                <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                />

                <label>Phone</label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />

                <label>Profile Image</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileImage(e.target.files[0])}
                />

                {message && <p>{message}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>

                <button type="button" onClick={onBack}>
                    Cancel
                </button>
            </form>
        </div>
    )
}

export default EditProfile