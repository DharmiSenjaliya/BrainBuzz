import axios from 'axios'

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        Accept: 'application/json',
    },
})

api.interceptors.request.use((config) => {
    const adminToken = localStorage.getItem('brainbuzz_admin_token')
    const playerToken = localStorage.getItem('brainbuzz_token')

    const token = adminToken || playerToken

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

export default api
