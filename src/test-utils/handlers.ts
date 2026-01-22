import { http, HttpResponse } from 'msw'

export const handlers = [
  // Match any host because tests may run with relative or absolute base URLs.
  http.post('*/api/download', async () => {
    return HttpResponse.json({
      url: 'https://s3.amazonaws.com/bucket/file?X-Amz-Signature=abc&X-Amz-Date=20000101T000000Z&X-Amz-Expires=60',
    })
  }),
  // Catch-all for local API requests that aren't relevant to the unit under test.
  // This prevents accidental real network calls during component smoke renders.
  http.all('*/api/*', async () => {
    return HttpResponse.json({})
  }),
]
