// Mutation: Unsubscribes an email address from the newsletter.
import { useMutation } from '@tanstack/react-query'

export function useNewsletterUnsubscribe() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await fetch('/api/UIUC-api/newsletterUnsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    },
  })
}
