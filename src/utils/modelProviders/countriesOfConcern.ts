/**
 * Countries-of-Concern registry.
 *
 * Maps individual LLM model IDs to a country flagged by the
 * U.S. Department of Commerce as a country of concern (China, Russia, Iran,
 * North Korea). UI surfaces (admin model toggles, chat model selector)
 * read this registry to render warning iconography and confirmation
 * popups before a user enables or selects a flagged model.
 */

export enum CountryOfConcern {
  China = 'China',
  Russia = 'Russia',
  Iran = 'Iran',
  NorthKorea = 'North Korea',
}

const CHINA_MODEL_IDS: ReadonlyArray<string> = [
  // DeepSeek (via OpenRouter)
  'deepseek/deepseek-chat-v3-0324',
  'deepseek/deepseek-chat-v3.1',
  'deepseek/deepseek-v3.1-terminus',
  'deepseek/deepseek-v3.2',
  'deepseek/deepseek-v3.2-exp',
  'deepseek/deepseek-v3.2-speciale',
  'deepseek/deepseek-r1-zero',
  'deepseek/deepseek-r1-0528-qwen3-8b',
  // DeepSeek (Ollama / self-hosted)
  'deepseek-r1:14b-qwen-distill-fp16',
  'deepseek-r1:32b',
  'deepseek-r1:70b',

  // Qwen / Alibaba
  'qwen/qwen3-32b',
  'qwen/qwen3-235b-a22b',
  'qwen/qwen3-vl-235b-a22b-thinking',
  'qwen/qwen3-coder-plus',
  'qwen/qwen3-vl-32b-instruct',
  'qwen/qwen2.5-vl-32b-instruct',
  'Qwen/Qwen2.5-VL-72B-Instruct',
  'qwen/qwen-2.5-72b-instruct',
  'eva-unit-01/eva-qwen-2.5-32b',
  // Qwen (Ollama / self-hosted)
  'qwen2.5:14b-instruct-fp16',
  'qwen2.5:7b-instruct-fp16',
  'qwen3:32b',
  // Qwen (Cerebras)
  'qwen-3-32b',
  'qwen-3-235b-a22b-instruct-2507',
  // Qwen (NCSA-hosted VLM)
  'Qwen/Qwen2-VL-72B-Instruct',
  'Qwen/Qwen2.5-VL-32B-Instruct',
  // Qwen (WebLLM in-browser)
  'Qwen2 7b Instruct',

  // Z.AI / THUDM / GLM
  'z-ai/glm-4.5',
  'z-ai/glm-4.5v',
  'z-ai/glm-4.5-air',
  'z-ai/glm-4.6',
  'thudm/glm-4.1v-9b-thinking',
  'zai-glm-4.6',

  // MoonshotAI Kimi
  'moonshotai/kimi-k2',
  'moonshotai/kimi-k2-0905',

  // MiniMax
  'minimax/minimax-m2',
]

const RUSSIA_MODEL_IDS: ReadonlyArray<string> = []
const IRAN_MODEL_IDS: ReadonlyArray<string> = []
const NORTH_KOREA_MODEL_IDS: ReadonlyArray<string> = []

const MODEL_COUNTRY_MAP: ReadonlyMap<string, CountryOfConcern> = new Map<
  string,
  CountryOfConcern
>([
  ...CHINA_MODEL_IDS.map(
    (id) => [id, CountryOfConcern.China] as [string, CountryOfConcern],
  ),
  ...RUSSIA_MODEL_IDS.map(
    (id) => [id, CountryOfConcern.Russia] as [string, CountryOfConcern],
  ),
  ...IRAN_MODEL_IDS.map(
    (id) => [id, CountryOfConcern.Iran] as [string, CountryOfConcern],
  ),
  ...NORTH_KOREA_MODEL_IDS.map(
    (id) => [id, CountryOfConcern.NorthKorea] as [string, CountryOfConcern],
  ),
])

export function getCountryOfConcern(
  modelId: string | undefined | null,
): CountryOfConcern | null {
  if (!modelId) return null
  return MODEL_COUNTRY_MAP.get(modelId) ?? null
}

export function isCountryOfConcern(
  modelId: string | undefined | null,
): boolean {
  return getCountryOfConcern(modelId) !== null
}

/**
 * Short label used inline next to a model name (tooltip/icon hover).
 */
export function getCountryOfConcernShortMessage(
  country: CountryOfConcern,
): string {
  return `This model originates from ${country}, a country of concern flagged by the U.S. Department of Commerce. Use with caution.`
}

const ACK_STORAGE_KEY = 'coc-acknowledged-chatbots'

function readAcknowledgedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(ACK_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function writeAcknowledgedSet(set: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      ACK_STORAGE_KEY,
      JSON.stringify(Array.from(set)),
    )
  } catch {
    // ignore quota / serialization errors — popup will simply re-fire next time
  }
}

/**
 * Whether the user has already acknowledged the country-of-concern warning
 * for this chatbot. Once acknowledged, no further popups fire for that
 * chatbot — across all flagged models.
 */
export function isChatbotCocAcknowledged(
  chatbotId: string | undefined | null,
): boolean {
  if (!chatbotId) return false
  return readAcknowledgedSet().has(chatbotId)
}

/**
 * Persist acknowledgment for a chatbot so the warning popup is shown
 * only on first enable of any flagged model. Subsequent enables anywhere
 * within this chatbot skip the modal.
 */
export function markChatbotCocAcknowledged(chatbotId: string): void {
  if (!chatbotId) return
  const set = readAcknowledgedSet()
  if (set.has(chatbotId)) return
  set.add(chatbotId)
  writeAcknowledgedSet(set)
}

/**
 * Longer message shown in the admin confirmation popup before enabling.
 */
export function getCountryOfConcernLongMessage(
  modelName: string,
  country: CountryOfConcern,
): string {
  return (
    `${modelName} originates from ${country}, which the U.S. Department of Commerce ` +
    `has identified as a country of concern. Models from these jurisdictions may carry ` +
    `data-handling, supply-chain, or compliance risks for your organization. ` +
    `You can still enable this model, but please confirm that doing so is consistent ` +
    `with your institution's policy.`
  )
}
