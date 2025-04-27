import { type GenericSupportedModel } from '../LLMProvider'

export enum SambaNovaModelID {
  // Preview Models
  DeepSeek_V3_0324 = 'DeepSeek-V3-0324',
  Llama_4_Scout_17B_16E_Instruct = 'Llama-4-Scout-17B-16E-Instruct',
  Llama_4_Maverick_17B_128E_Instruct = 'Llama-4-Maverick-17B-128E-Instruct',

  // Production Models
  DeepSeek_R1 = 'DeepSeek-R1',
  DeepSeek_R1_Distill_Llama_70B = 'DeepSeek-R1-Distill-Llama-70B',
  Meta_Llama_3_3_70B_Instruct = 'Meta-Llama-3.3-70B-Instruct',
  Meta_Llama_3_2_3B_Instruct = 'Meta-Llama-3.2-3B-Instruct',
  Meta_Llama_3_2_1B_Instruct = 'Meta-Llama-3.2-1B-Instruct',
  Meta_Llama_3_1_405B_Instruct = 'Meta-Llama-3.1-405B-Instruct',
  Meta_Llama_3_1_8B_Instruct = 'Meta-Llama-3.1-8B-Instruct',
  Meta_Llama_Guard_3_8B = 'Meta-Llama-Guard-3-8B',
  QwQ_32B = 'QwQ-32B',
  Llama_3_3_Swallow_70B_Instruct_v0_4 = 'Llama-3.3-Swallow-70B-Instruct-v0.4',
  E5_Mistral_7B_Instruct = 'E5-Mistral-7B-Instruct',
}

// Define preferred order of models based on quality (best first) - subjective ordering
export const SambanovaPreferredModelIDs: SambaNovaModelID[] = [
  // Largest/Newest Production Models
  SambaNovaModelID.Meta_Llama_3_1_405B_Instruct,
  SambaNovaModelID.DeepSeek_R1_Distill_Llama_70B,
  SambaNovaModelID.Meta_Llama_3_3_70B_Instruct,
  SambaNovaModelID.Llama_3_3_Swallow_70B_Instruct_v0_4,
  SambaNovaModelID.DeepSeek_R1,

  // Other Production Models
  SambaNovaModelID.QwQ_32B,
  SambaNovaModelID.Meta_Llama_3_1_8B_Instruct,
  SambaNovaModelID.Meta_Llama_Guard_3_8B,
  SambaNovaModelID.E5_Mistral_7B_Instruct,
  SambaNovaModelID.Meta_Llama_3_2_3B_Instruct,
  SambaNovaModelID.Meta_Llama_3_2_1B_Instruct,

  // Preview Models (Generally lower priority)
  SambaNovaModelID.Llama_4_Maverick_17B_128E_Instruct, // Larger preview model
  SambaNovaModelID.Llama_4_Scout_17B_16E_Instruct,
  SambaNovaModelID.DeepSeek_V3_0324,
]

export interface SambaNovaModel extends GenericSupportedModel {
  id: SambaNovaModelID
  name: string
  tokenLimit: number
  enabled: boolean
}

export const SambaNovaModels: Record<SambaNovaModelID, SambaNovaModel> = {
  // Preview Models
  [SambaNovaModelID.DeepSeek_V3_0324]: {
    id: SambaNovaModelID.DeepSeek_V3_0324,
    name: 'DeepSeek V3 0324 Preview',
    tokenLimit: 8_000,
    enabled: true,
  },
  [SambaNovaModelID.Llama_4_Scout_17B_16E_Instruct]: {
    id: SambaNovaModelID.Llama_4_Scout_17B_16E_Instruct,
    name: 'Llama 4 Scout 17B Preview',
    tokenLimit: 8_000,
    enabled: true,
  },
  [SambaNovaModelID.Llama_4_Maverick_17B_128E_Instruct]: {
    id: SambaNovaModelID.Llama_4_Maverick_17B_128E_Instruct,
    name: 'Llama 4 Maverick 17B Preview',
    tokenLimit: 8_000,
    enabled: true
  },

  // Production Models
  [SambaNovaModelID.DeepSeek_R1]: {
    id: SambaNovaModelID.DeepSeek_R1,
    name: 'DeepSeek R1',
    tokenLimit: 16_000,
    enabled: true,
  },
  [SambaNovaModelID.DeepSeek_R1_Distill_Llama_70B]: {
    id: SambaNovaModelID.DeepSeek_R1_Distill_Llama_70B,
    name: 'DeepSeek R1 Distill Llama 70B',
    tokenLimit: 128_000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_3_70B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_3_70B_Instruct,
    name: 'Meta Llama 3.3 70B Instruct',
    tokenLimit: 128_000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_2_3B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_2_3B_Instruct,
    name: 'Meta Llama 3.2 3B Instruct',
    tokenLimit: 8_000,
    enabled: false, // Disabling smaller production models by default
  },
  [SambaNovaModelID.Meta_Llama_3_2_1B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_2_1B_Instruct,
    name: 'Meta Llama 3.2 1B Instruct',
    tokenLimit: 16_000,
    enabled: false, // Disabling smaller production models by default
  },
  [SambaNovaModelID.Meta_Llama_3_1_405B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_1_405B_Instruct,
    name: 'Meta Llama 3.1 405B Instruct',
    tokenLimit: 16_000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_1_8B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_1_8B_Instruct,
    name: 'Meta Llama 3.1 8B Instruct',
    tokenLimit: 16_000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_Guard_3_8B]: {
    id: SambaNovaModelID.Meta_Llama_Guard_3_8B,
    name: 'Meta Llama Guard 3 8B',
    tokenLimit: 8_000,
    enabled: false, // Disabling guard model by default
  },
  [SambaNovaModelID.QwQ_32B]: {
    id: SambaNovaModelID.QwQ_32B,
    name: 'QwQ 32B',
    tokenLimit: 16_000,
    enabled: true,
  },
  [SambaNovaModelID.Llama_3_3_Swallow_70B_Instruct_v0_4]: {
    id: SambaNovaModelID.Llama_3_3_Swallow_70B_Instruct_v0_4,
    name: 'Llama 3.3 Swallow 70B Instruct v0.4',
    tokenLimit: 16_000,
    enabled: true,
  },
  [SambaNovaModelID.E5_Mistral_7B_Instruct]: {
    id: SambaNovaModelID.E5_Mistral_7B_Instruct,
    name: 'E5 Mistral 7B Instruct',
    tokenLimit: 4_000,
    enabled: false, // Disabling model with smallest token limit
  },
}
