import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Gan access token vao moi request neu da dang nhap
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Xu ly loi tap trung; se bo sung logic refresh token o SCRUM-14
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // TODO SCRUM-14: thu refresh token truoc khi dang xuat
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default axiosClient
