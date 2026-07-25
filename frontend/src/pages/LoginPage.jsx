import { useState } from 'react'
import authApi from '../api/authApi'
import Input from '../shared/components/Input.jsx'
import Button from '../shared/components/Button.jsx'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await authApi.login(form)
      localStorage.setItem('access_token', res.data.accessToken)
      window.location.href = '/'
    } catch (err) {
      setError(err.message || 'Dang nhap that bai')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page login-page">
      <h1>Dang nhap</h1>
      <form onSubmit={handleSubmit}>
        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <Input label="Mat khau" name="password" type="password" value={form.password} onChange={handleChange} required />
        {error && <p className="error-text">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? 'Dang xu ly...' : 'Dang nhap'}</Button>
      </form>
    </div>
  )
}
