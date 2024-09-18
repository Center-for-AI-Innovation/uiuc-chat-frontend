import { kv } from '@vercel/kv'
import { type NextRequest, NextResponse } from 'next/server'
import { getAllCourseMetadata } from './getAllCourseMetadata'
import { CourseMetadata } from '~/types/courseMetadata'
import OpenAI from 'openai'
import {
  OpenAIModelID,
  OpenAIModels,
} from '~/utils/modelProviders/types/openai'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'
import { encryptKeyIfNeeded } from '~/utils/crypto'

export const runtime = 'edge'
export const maxDuration = 60

export default async function handler(
  req: NextRequest,
  res: NextResponse,
): Promise<NextResponse> {
  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const result = await migrateAllKeys()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error during migration:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// WARNING
// Some disabled models are no longer supported. Keep in mind...
// "disabled_models": [
//   "gpt-4-vision-preview",
//   "gpt-4-1106-preview",
//   "gpt-4",
//   "gpt-3.5-turbo",
//   "gpt-3.5-turbo-16k"
// ],

export const migrateAllKeys = async () => {
  // Step 1: Grab all course_metadatas
  const allCourseMetadata = await getAllCourseMetadata()

  if (!allCourseMetadata) {
    throw new Error('No course metadata found')
  }

  // Step 2: Check conditions and print matching course_metadata objects
  const matchingCourses: { [key: string]: CourseMetadata }[] = []

  allCourseMetadata.forEach((courseObj) => {
    const [[courseName, metadata]] = Object.entries(courseObj) as [
      [string, CourseMetadata],
    ]
    if (
      metadata.openai_api_key &&
      metadata.openai_api_key !== '' &&
      metadata.disabled_models &&
      metadata.disabled_models.length > 0
    ) {
      matchingCourses.push({ [courseName]: metadata })
    }
  })

  console.log('Matching courses:', JSON.stringify(matchingCourses, null, 2))

  let newlyMigratedCourses = 0
  let alreadyMigratedCourses = 0

  // Step 3: Iterate through matching courses
  for (const courseObj of matchingCourses) {
    const [courseName, metadata] = Object.entries(courseObj)[0] ?? []
    if (!courseName || !metadata) continue
    console.log(`Processing course: ${courseName}`)

    try {
      // 1. Decrypt the OpenAI API key
      if (metadata.openai_api_key) {
        const decryptedKey = await legacy___parseOpenaiKey(
          metadata.openai_api_key,
        )
        console.log('Decrypted key:', decryptedKey)

        const encryptedKey = await encryptKeyIfNeeded(decryptedKey)

        // Set all models enabled by default
        const openAIModels = Object.values(OpenAIModels)

        if (metadata.disabled_models) {
          console.log('Disabled models:', metadata.disabled_models)

          // Iterate through all OpenAI models, assume they're enabled by default unless there's a match with a model that's disabled by ID.
          // If a match is found, set the model to disabled.
          for (const model of openAIModels) {
            if (metadata.disabled_models.includes(model.id)) {
              model.enabled = false
            } else {
              model.enabled = true
            }
          }
          // console.log("OpenAI objects:", openAIModels)
        } else {
          // No disabled models, so all are enabled...
        }

        // HERE WE UPSERT --

        const llmProvidersInDB = await kv.get(`${courseName}-llms`)

        if (!llmProvidersInDB) {
          console.log('No LLMs in DB, setting new LLMs...')
          const final_LLMs = {
            defaultModel: OpenAIModelID.GPT_4o_mini,
            defaultTemp: 0.1,
            [ProviderNames.OpenAI]: {
              provider: ProviderNames.OpenAI,
              enabled: true,
              models: openAIModels,
              apiKey: encryptedKey,
            },
          }
          console.log('Setting new LLMs:', final_LLMs)

          await kv.set(`${courseName}-llms`, final_LLMs)
          newlyMigratedCourses++
        } else {
          console.log('LLMs already exist in DB :)')
          alreadyMigratedCourses++
        }
        await new Promise((resolve) => setTimeout(resolve, 501))
      }

      console.log(
        `Successfully processed course: ${courseName}. Newly migrated: ${newlyMigratedCourses}, already migrated: ${alreadyMigratedCourses}`,
      )
    } catch (error) {
      console.error(`Error processing course ${courseName}:`, error)
    }
  }
}

// get all courses with legacy keys.
// Ensure they have the new key. If not, migrate them.

export const legacy___parseOpenaiKey = async (openaiKey: string) => {
  if (openaiKey && legacy___isEncrypted(openaiKey)) {
    const decryptedText = await legacy___decrypt(
      openaiKey,
      process.env.NEXT_PUBLIC_SIGNING_KEY as string,
    )
    openaiKey = decryptedText as string
  } else {
    // console.log('Using client key for openai chat: ', apiKey)
  }
  return openaiKey
}

export const legacy___decrypt = async (encryptedText: string, key: string) => {
  if (!encryptedText || !key) {
    console.error(
      'Error decrypting because encryptedText or key is not available',
      encryptedText,
      key,
    )
    return
  }
  const [encryptedBase64, ivBase64] = encryptedText.split('.')
  if (!ivBase64 || !encryptedBase64) {
    throw new Error('Invalid API key format')
  }
  const pwUtf8 = new TextEncoder().encode(key)
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8)
  const iv = Buffer.from(ivBase64, 'base64')
  const alg = { name: 'AES-GCM', iv: new Uint8Array(iv) }
  const decryptKey = await crypto.subtle.importKey('raw', pwHash, alg, false, [
    'decrypt',
  ])
  const ptBuffer = await crypto.subtle.decrypt(
    alg,
    decryptKey,
    Buffer.from(encryptedBase64, 'base64'),
  )
  return new TextDecoder().decode(ptBuffer)
}

export function legacy___isEncrypted(str: string) {
  const base64Regex =
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/
  const parts = str.split('.')
  return (
    parts.length === 2 &&
    base64Regex.test(parts[0] as string) &&
    base64Regex.test(parts[1] as string)
  )
}
