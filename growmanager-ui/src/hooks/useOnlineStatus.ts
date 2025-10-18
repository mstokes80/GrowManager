/**
 * Online Status Hook
 *
 * Detects and tracks online/offline status using the Network Information API.
 * Provides real-time updates when connectivity changes.
 */

import { useState, useEffect } from 'react'

/**
 * Hook to track online/offline status
 *
 * @returns isOnline - boolean indicating current online status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network status: ONLINE')
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log('Network status: OFFLINE')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}