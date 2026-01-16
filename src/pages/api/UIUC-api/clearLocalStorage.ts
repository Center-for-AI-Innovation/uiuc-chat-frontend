import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
export default function clearLocalStorageOnce() {
  const isLocalStorageCleared = localStorage.getItem('isLocalStorageCleared')

  if (!isLocalStorageCleared) {
    localStorage.clear()
    localStorage.setItem('isLocalStorageCleared', 'true')
  }
}
