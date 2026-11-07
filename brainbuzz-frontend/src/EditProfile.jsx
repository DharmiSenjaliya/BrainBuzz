
import { useState } from 'react'
import Select from 'react-select'
import {
    getCountries,
    getCountryCallingCode,
    parsePhoneNumberFromString,
} from 'libphonenumber-js'
import './EditProfile.css'
import api from './services/api'

const countryNames = new Intl.DisplayNames(['en'], {
    type: 'region',
})

function getFlag(countryCode) {
    return String.fromCodePoint(
        ...countryCode
            .toUpperCase()
            .split('')
            .map((char) => 127397 + char.charCodeAt(0))
    )
}

const countries = getCountries()
    .map((code) => {
        const name = countryNames.of(code) || code
        const dialCode = getCountryCallingCode(code)

        return {
            value: code,
            name,
            dialCode,
            flag: getFlag(code),
            label: `${getFlag(code)} ${name} (+${dialCode})`,
        }
    })
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

    return { country: 'IN', phone: value }
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
        (item) => item.value === country
    )

    const selectedOption = selectedCountry || countries.find(
        (item) => item.value === 'IN'
    )

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

                <div className="phone-input-wrapper">

                    <div className="phone-country-select">
                        <Select
                            className="country-react-select"
                            classNamePrefix="country"
                            options={countries}
                            value={selectedOption}
                            onChange={(option) => {
                                if (option) {
                                    setCountry(option.value)
                                    setPhoneError('')
                                    setMessage('')
                                }
                            }}
                            isSearchable
                            isClearable={false}
                            placeholder="Country"
                            noOptionsMessage={() => 'No country found'}
                            filterOption={(option, inputValue) => {
                                const search = inputValue
                                    .toLowerCase()
                                    .replace('+', '')
                                    .trim()

                                return (
                                    option.data.name.toLowerCase().includes(search) ||
                                    option.data.value.toLowerCase().includes(search) ||
                                    option.data.dialCode.includes(search) ||
                                    (search === 'usa' && option.data.value === 'US') ||
                                    (search === 'uk' && option.data.value === 'GB')
                                )
                            }}
                            formatOptionLabel={(option, { context }) => (
                                <span>
                                    {context === 'value'
                                        ? `${option.flag} +${option.dialCode}`
                                        : `${option.flag} ${option.name} (+${option.dialCode})`
                                    }
                                </span>
                            )}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            styles={{
                                container: (base) => ({
                                    ...base,
                                    width: '100%',
                                }),
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: '#0f172a',
                                    border: 'none',
                                    borderRight: '1px solid #475569',
                                    borderRadius: '8px 0 0 8px',
                                    minHeight: '46px',
                                    boxShadow: 'none',
                                    cursor: 'text',
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    padding: '0 4px 0 10px',
                                    flexWrap: 'nowrap',
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 600,
                                }),
                                input: (base) => ({
                                    ...base,
                                    color: 'white',
                                    margin: 0,
                                    padding: 0,
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    paddingRight: 4,
                                }),
                                dropdownIndicator: (base) => ({
                                    ...base,
                                    color: '#a78bfa',
                                    padding: 4,
                                }),
                                indicatorSeparator: () => ({
                                    display: 'none',
                                }),
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                                menu: (base) => ({
                                    ...base,
                                    backgroundColor: '#1e293b',
                                    width: '250px',
                                }),
                                menuList: (base) => ({
                                    ...base,
                                    maxHeight: '220px',
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused
                                        ? '#334155'
                                        : '#1e293b',
                                    color: 'white',
                                    cursor: 'pointer',
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    color: '#94a3b8',
                                }),
                            }}
                        />
                    </div>

                    <input
                        type="tel"
                        className="phone-number-input"
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value)
                            setPhoneError('')
                            setMessage('')
                        }}
                        placeholder="Enter phone number"
                        inputMode="tel"
                        autoComplete="tel-national"
                    />
                </div>

                {phoneError && (
                    <p className="phone-validation-error">
                        {phoneError}
                    </p>
                )}

                <small className="phone-help-text">
                    Click the country code to change your country.
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
