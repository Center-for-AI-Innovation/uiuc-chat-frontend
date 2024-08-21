import { OpenAIModel } from '~/utils/modelProviders/openai'

export interface Prompt {
  id: string
  name: string
  description: string
  content: string
  model: OpenAIModel
  folderId: string | null
}
