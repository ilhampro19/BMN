import { createContext, useState, useContext } from 'react'
import axios from 'axios'

// Context ini "papan pengumuman" tempat data auth disimpan,
// bisa diakses komponen mana aja tanpa perlu dioper lewat props
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Coba baca token & user dari localStorage saat pertama kali app dibuka.
  // Ini penting supaya kalau user refresh halaman, mereka nggak otomatis
  // ke-logout - status login mereka "diingat" browser.
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  async function login(email, password) {
    const response = await axios.post('http://localhost:5000/api/users/login', {
      email,
      password,
    })

    const { token, user } = response.data

    // Simpan ke localStorage supaya bertahan meskipun halaman di-refresh
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))

    // Simpan juga ke state supaya komponen yang pakai Context ini
    // langsung update tanpa perlu refresh halaman
    setToken(token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token, // true kalau ada token, false kalau null
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook biar komponen lain tinggal pakai useAuth()
// daripada harus import useContext + AuthContext tiap kali
export function useAuth() {
  return useContext(AuthContext)
}