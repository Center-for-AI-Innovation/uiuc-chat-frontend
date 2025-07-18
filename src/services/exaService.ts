import ExaClient from 'exa-js'

export const exaSearch = async (query: string, apiKey: string) => {
  const client = new ExaClient(apiKey)
  const response = await client.search(query, { numResults: 5 })
  return response.results
}
