// src/pages/api/validateKey.ts
import {
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_API_VERSION,
  OPENAI_ORGANIZATION,
} from '@/utils/app/const'
import { NextRequest, NextResponse } from 'next/server'
import modelsHandler from './models'
import { decrypt } from '~/utils/crypto'
import { OpenAIError } from '~/utils/server'

export const config = {
  runtime: 'edge',
}

const handler = async (req: Request): Promise<Response> => {
  let apiKey = ''
  let apiType = OPENAI_API_TYPE
  let endpoint = OPENAI_API_HOST
  try {
    const { key, isAzure } = (await req.json()) as {
      key: string
      isAzure: boolean
    }
    apiKey = key ? key : (process.env.OPENAI_API_KEY as string)

    if (isAzure) {
      console.log('setting azure variables')
      apiType = 'azure'
      endpoint = process.env.AZURE_OPENAI_ENDPOINT || OPENAI_API_HOST
    } else if (key && !key.startsWith('sk-')) {
      const decryptedText = await decrypt(
        key,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )
      apiKey = decryptedText as string
    }

    if (!apiKey) {
      return new Response('Warning: OpenAI Key was not found', { status: 400 })
    }

    let url = `${endpoint}/v1/chat/completions`
    if (apiType === 'azure') {
      try {
        const modelsRequest = new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify({ key: apiKey }),
        })

        const deploymentsResponse = await modelsHandler(modelsRequest)
        if (!deploymentsResponse.ok) {
          throw new Error(
            `Failed to retrieve deployments: ${deploymentsResponse.statusText}`,
          )
        }
        const deployments = await deploymentsResponse.json()
        // console.log('deployments: ', deployments)
        // Assumption: there is only one deployment
        // How to handle multiple deployments? Maybe we should pass model.id all the way from home fetched from local storage?
        const deploymentName =
          deployments[0]?.id || process.env.AZURE_OPENAI_ENGINE
        if (!deploymentName) {
          throw new Error('Deployment name not found')
        }
        // console.log('deploymentName: ', deploymentName)
        url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${OPENAI_API_VERSION}`
        console.log('Created Azure url: ', url)
      } catch (error) {
        console.error('Error fetching Azure deployments:', error)
        throw error
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiType === 'openai' && {
          Authorization: `Bearer ${apiKey}`,
        }),
        ...(apiType === 'azure' && {
          'api-key': `${apiKey}`,
        }),
        ...(apiType === 'openai' &&
          OPENAI_ORGANIZATION && {
            'OpenAI-Organization': OPENAI_ORGANIZATION,
          }),
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'I' }], // min tokens for testing
        max_tokens: 1,
      }),
    })

    const decoder = new TextDecoder()

    if (response.status !== 200) {
      const result = await response.json()
      if (result.error) {
        throw new OpenAIError(
          result.error.message,
          result.error.type,
          result.error.param,
          result.error.code,
        )
      } else {
        throw new Error(
          `OpenAI API returned an error: ${
            decoder.decode(result?.value) || result.statusText
          }`,
        )
      }
    }

    const json = await response.json()

    return new Response(JSON.stringify(json), { status: 200 })
  } catch (error) {
    if (error instanceof OpenAIError) {
      const { name, message } = error
      console.log('Printing message here', message)
      const resp = NextResponse.json(
        {
          statusCode: 400,
          name: name,
          message: message,
        },
        { status: 400 },
      )
      console.log('Final OpenAIError resp: ', resp)
      return resp
    } else {
      const resp = NextResponse.json({ name: 'Error' }, { status: 500 })
      console.log('Final Error resp: ', resp)
      return resp
    }
  }
}

export default handler
