'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../auths/context/auth-context'

interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  picture?: string
  verified: boolean
  status: string
  role?: string
}

export default function Welcome() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { logout } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router])


  if (loading) {
    return (
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-auto">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              {/* Welcome Header */}
              <div className="text-center mb-4">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="rounded-circle mb-3"
                    width="100"
                    height="100"
                  />
                )}
                <h1 className="display-5 fw-bold text-primary mb-2">
                  Welcome, {user?.firstName || user?.name}! 👋
                </h1>
                <p className="text-muted lead">
                  You have successfully logged in
                </p>
              </div>

              {/* User Info Card */}
              <div className="card bg-light border-0 mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="bi bi-person-circle me-2"></i>
                    Your Profile
                  </h5>
                  
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-envelope-fill text-primary me-3"></i>
                        <div>
                          <small className="text-muted d-block">Email</small>
                          <strong>{user?.email}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-person-fill text-primary me-3"></i>
                        <div>
                          <small className="text-muted d-block">Full Name</small>
                          <strong>{user?.name}</strong>
                        </div>
                      </div>
                    </div>

                    {user?.role && (
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-shield-fill text-primary me-3"></i>
                          <div>
                            <small className="text-muted d-block">Role</small>
                            <span className="badge bg-primary">{user.role}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-12">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-check-circle-fill text-success me-3"></i>
                        <div>
                          <small className="text-muted d-block">Status</small>
                          <span className={`badge ${user?.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                            {user?.status}
                          </span>
                          {user?.verified && (
                            <span className="badge bg-info ms-2">
                              <i className="bi bi-patch-check-fill me-1"></i>
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => router.push('/modules')}
                >
                  <i className="bi bi-speedometer2 me-2"></i>
                  Go to Modules
                </button>
                
                <button
                  className="btn btn-outline-danger"
                  onClick={logout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-4">
            <p className="text-muted small">
              <i className="bi bi-shield-check me-1"></i>
              Your session is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}