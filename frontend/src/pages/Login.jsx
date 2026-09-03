import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    // Prevent the browser from reloading the page on form submit (default HTML behavior)
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // Login succeeded - move to Dashboard
      navigate('/dashboard')
    } catch (err) {
      // Axios stores the backend's error message at err.response.data.message
      setError(err.response?.data?.message || 'Gagal login. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-lg border shadow-sm"
      >
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}

        <div className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div className="mb-6">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </Button>
      </form>
    </div>
  )
}

export default Login