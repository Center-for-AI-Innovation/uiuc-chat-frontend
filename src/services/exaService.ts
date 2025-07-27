interface ExaSearchResult {
  title: string
  url: string
  snippet?: string
  text?: string
  summary?: string
}

interface ExaSearchResponse {
  results: ExaSearchResult[]
}

export const exaSearch = async (
  query: string,
  apiKey: string,
): Promise<ExaSearchResult[]> => {
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

  if (!response.ok) {
    throw new Error(`Exa API error: ${response.status}`)
  }

  const data: ExaSearchResponse = await response.json()
  return data.results
}
