import { useState } from 'react'
import authApi from '../api/authApi'
import Input from '../shared/components/Input.jsx'
import Button from '../shared/components/Button.jsx'

/**
 * SCRUM-09: Owner Self-registration. Form day du (bao gom onboarding ho kinh
 * doanh SCRUM-11 va chon goi SCRUM-12) se duoc mo rong trong Sprint 1-2.
 */
export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
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
      await authApi.registerOwner(form)
      window.location.href = '/login'
    } catch (err) {
      setError(err.message || 'Dang ky that bai')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page register-page">
      <h1>Dang ky tai khoan Owner</h1>
      <form onSubmit={handleSubmit}>
        <Input label="Ho ten" name="fullName" value={form.fullName} onChange={handleChange} required />
        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <Input label="Mat khau" name="password" type="password" value={form.password} onChange={handleChange} required />
        {error && <p className="error-text">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? 'Dang xu ly...' : 'Dang ky'}</Button>
      </form>
    </div>
  )
}
