import { type GenericSupportedModel } from '../LLMProvider'

export enum SambaNovaModelID {
  Meta_Llama_3_1_70B_SD = 'meta-llama-3.1-70b-sd',
  Meta_Llama_3_1_405B_SD = 'meta-llama-3.1-405b-sd',
  Meta_Llama_3_1_405B_Instruct_FP8 = 'meta-llama-3.1-405b-instruct-fp8',
  Qwen2_5_72B_Instruct = 'qwen2.5-72b-instruct',
  Qwen2_5_0_5B_Instruct = 'qwen2.5-0.5b-instruct',
  Meta_Llama_3_1_405B_Instruct = 'meta-llama-3.1-405b-instruct',
  Meta_Llama_3_2_1B_Instruct = 'meta-llama-3.2-1b-instruct',
  Meta_Llama_3_70_Instruct = 'meta-llama-3-70-instruct',
}

export interface SambaNovaModel extends GenericSupportedModel {
  id: SambaNovaModelID
  name: string
  tokenLimit: number
  enabled: boolean
}

export const SambaNovaModels: Record<SambaNovaModelID, SambaNovaModel> = {
  [SambaNovaModelID.Meta_Llama_3_1_70B_SD]: {
    id: SambaNovaModelID.Meta_Llama_3_1_70B_SD,
    name: 'Meta Llama 3.1 70B SD',
    tokenLimit: 128000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_1_405B_SD]: {
    id: SambaNovaModelID.Meta_Llama_3_1_405B_SD,
    name: 'Meta Llama 3.1 405B SD',
    tokenLimit: 128000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_1_405B_Instruct_FP8]: {
    id: SambaNovaModelID.Meta_Llama_3_1_405B_Instruct_FP8,
    name: 'Meta Llama 3.1 405B Instruct FP8',
    tokenLimit: 128000,
    enabled: true,
  },
  [SambaNovaModelID.Qwen2_5_72B_Instruct]: {
    id: SambaNovaModelID.Qwen2_5_72B_Instruct,
    name: 'Qwen 2.5 72B Instruct',
    tokenLimit: 128000,
    enabled: true,
  },
  [SambaNovaModelID.Qwen2_5_0_5B_Instruct]: {
    id: SambaNovaModelID.Qwen2_5_0_5B_Instruct,
    name: 'Qwen 2.5 0.5B Instruct',
    tokenLimit: 32000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_1_405B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_1_405B_Instruct,
    name: 'Meta Llama 3.1 405B Instruct',
    tokenLimit: 128000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_2_1B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_2_1B_Instruct,
    name: 'Meta Llama 3.2 1B Instruct',
    tokenLimit: 128000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_70_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_70_Instruct,
    name: 'Meta Llama 3 70B Instruct',
    tokenLimit: 128000,
    enabled: true,
  },
} 