import Exa from 'exa-js'

export const exaSearch = async (query: string, apiKey: string) => {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      numResults: 5,
      contents: {
        text: true,
        highlights: true,
        summary: true,
      },
    }),
  })
  const data = await response.json()
  return data.results
}
