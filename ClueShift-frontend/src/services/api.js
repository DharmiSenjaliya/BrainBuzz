import axios from 'axios'

const normalizeBaseUrl = (value, settingName) => {
    try {
        return new URL(value).toString().replace(/\/+$/, '')
    } catch {
        throw new Error(`${settingName} must be an absolute URL.`)
    }
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
export const API_BASE_URL = normalizeBaseUrl(
    configuredApiBaseUrl ||
        (import.meta.env.DEV
            ? 'http://127.0.0.1:8001/api'
            : `${window.location.origin}/api`),
    'VITE_API_BASE_URL'
)

const configuredStorageBaseUrl = import.meta.env.VITE_STORAGE_BASE_URL?.trim()
export const STORAGE_BASE_URL = normalizeBaseUrl(
    configuredStorageBaseUrl || new URL(API_BASE_URL).origin,
    'VITE_STORAGE_BASE_URL'
)

export const getStorageUrl = (path) => {
    if (/^https?:\/\//i.test(path)) {
        return path
    }

    const relativePath = path.replace(/^\/+/, '').replace(/^storage\//i, '')
    return `${STORAGE_BASE_URL}/storage/${relativePath}`
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Accept: 'application/json',
    },
})

api.interceptors.request.use((config) => {
    const adminToken = localStorage.getItem('clueshift_admin_token') || localStorage.getItem('brainbuzz_admin_token')
    const playerToken = localStorage.getItem('clueshift_token') || localStorage.getItem('brainbuzz_token')

    const token = adminToken || playerToken

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

export default api
