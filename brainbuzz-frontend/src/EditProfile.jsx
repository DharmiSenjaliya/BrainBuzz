
import { useState } from 'react'
import {
    getCountries,
    getCountryCallingCode,
    parsePhoneNumberFromString,
} from 'libphonenumber-js'
import './EditProfile.css'
import api from './services/api'

// Get all supported countries
const countryNames = new Intl.DisplayNames(['en'], {
    type: 'region',
})

const countries = getCountries()
    .map((code) => ({
        code,
        name: countryNames.of(code) || code,
        dialCode: getCountryCallingCode(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

function getInitialPhoneData(value) {
    if (!value) {
        return { country: 'IN', phone: '' }
    }

    const parsed = parsePhoneNumberFromString(value)

    if (parsed?.country) {
        return {
            country: parsed.country,
            phone: parsed.nationalNumber,
        }
    }

    return {
        country: 'IN',
        phone: value,
    }
}

function getFlag(countryCode) {
    return String.fromCodePoint(
        ...countryCode
            .toUpperCase()
            .split('')
            .map((char) => 127397 + char.charCodeAt(0))
    )
}

function EditProfile({ user, onBack, onProfileUpdated }) {
    const initialPhone = getInitialPhoneData(user?.phone)

    const [name, setName] = useState(user?.name || '')
    const [country, setCountry] = useState(initialPhone.country)
    const [phone, setPhone] = useState(initialPhone.phone)
    const [profileImage, setProfileImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [phoneError, setPhoneError] = useState('')

    const selectedCountry = countries.find(
        (item) => item.code === country
    )

    const handlePhoneChange = (value) => {
        setPhone(value)
        setPhoneError('')
        setMessage('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setMessage('')
        setPhoneError('')

        let formattedPhone = ''

        if (phone.trim()) {
            const parsedPhone = parsePhoneNumberFromString(
                phone,
                country
            )

            if (!parsedPhone || !parsedPhone.isValid()) {
                setPhoneError(
                    `Please enter a valid ${selectedCountry?.name || 'country'} phone number.`
                )
                return
            }

            formattedPhone = parsedPhone.number
        }

        try {
            setLoading(true)

            const token = localStorage.getItem('brainbuzz_token')
            const formData = new FormData()

            formData.append('name', name.trim())
            formData.append('phone', formattedPhone)

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
                name: name.trim(),
                phone: formattedPhone,
            }

            onProfileUpdated(updatedUser)
        } catch (error) {
            const backendPhoneError =
                error.response?.data?.errors?.phone?.[0]

            setMessage(
                backendPhoneError ||
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
                    maxLength={255}
                />

                <label>Email</label>
                <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                />

                <label>Phone Number</label>

                <div className="international-phone-group">

                    <select
                        className="country-select"
                        value={country}
                        onChange={(e) => {
                            setCountry(e.target.value)
                            setPhoneError('')
                            setMessage('')
                        }}
                    >
                        {countries.map((item) => (
                            <option key={item.code} value={item.code}>
                                {getFlag(item.code)} {item.name} (+{item.dialCode})
                            </option>
                        ))}
                    </select>

                    <div className="phone-input-wrapper">
                        <span className="phone-country-code">
                            +{selectedCountry?.dialCode}
                        </span>

                        <input
                            type="tel"
                            className="phone-number-input"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="Enter phone number"
                            inputMode="tel"
                            autoComplete="tel-national"
                        />
                    </div>
                </div>

                {phoneError && (
                    <p className="phone-validation-error">
                        {phoneError}
                    </p>
                )}

                <small className="phone-help-text">
                    Select your country and enter your phone number.
                </small>

                <label>Profile Image</label>
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                        setProfileImage(e.target.files?.[0] || null)
                    }
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
