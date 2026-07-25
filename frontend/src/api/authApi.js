import axiosClient from './axiosClient'

const authApi = {
  registerOwner: (payload) => axiosClient.post('/auth/register', payload),
  login: (payload) => axiosClient.post('/auth/login', payload),
  logout: () => axiosClient.post('/auth/logout'),
}

export default authApi
