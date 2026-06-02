'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL parameters
        const token = searchParams.get('token')
        const refreshToken = searchParams.get('refreshToken')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setTimeout(() => {
            // router.push('/sign-in')
            console.log('Redirected to login page')
          }, 3000)
          return
        }

        if (token && refreshToken) {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', token)
          localStorage.setItem('refreshToken', refreshToken)

          // Get user info
          const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const userData = await response.json()
            localStorage.setItem('user', JSON.stringify(userData.data))
            
            setStatus('success')
            
            // Redirect to welcome page after 1 second
            setTimeout(() => {
              // router.push('/modules')
              window.location.href = "/modules";
              console.log('Redirected to welcome page')
            }, 1000)
          } else {
            throw new Error('Failed to fetch user data')
          }
        } else {
          throw new Error('No tokens received')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setTimeout(() => {
          router.push('/sign-up')
          console.log('Redirected to login page. Try again later.')
        }, 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5 text-center">
              {status === 'loading' && (
                <>
                  <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h4 className="mb-2">Authenticating...</h4>
                  <p className="text-muted">Please wait while we sign you in</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="text-success mb-3">
                    <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h4 className="mb-2">Success!</h4>
                  <p className="text-muted">Redirecting to your dashboard...</p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="text-danger mb-3">
                    <i className="bi bi-x-circle-fill" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h4 className="mb-2">Authentication Failed</h4>
                  <p className="text-muted">Redirecting to login page...</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthCallbackLoading() {
  return (
    <div className="container">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5 text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h4 className="mb-2">Loading...</h4>
              <p className="text-muted">Please wait</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  )
}