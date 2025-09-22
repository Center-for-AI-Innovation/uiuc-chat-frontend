export default function clearLocalStorageOnce() {
  const isLocalStorageCleared = localStorage.getItem('isLocalStorageCleared')

  if (!isLocalStorageCleared) {
    localStorage.clear()
    localStorage.setItem('isLocalStorageCleared', 'true')
  }
}
