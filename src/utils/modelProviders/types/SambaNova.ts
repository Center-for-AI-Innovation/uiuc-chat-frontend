import { type GenericSupportedModel } from '../LLMProvider'

export enum SambaNovaModelID {
  DeepSeek_R1 = 'DeepSeek-R1',
  DeepSeek_R1_Distill_Llama_70B = 'DeepSeek-R1-Distill-Llama-70B',
  Llama_3_1_Tulu_3_405B = 'Llama-3.1-Tulu-3-405B',
  Meta_Llama_3_1_405B_Instruct = 'Meta-Llama-3.1-405B-Instruct',
  Meta_Llama_3_1_70B_Instruct = 'Meta-Llama-3.1-70B-Instruct',
  Meta_Llama_3_1_8B_Instruct = 'Meta-Llama-3.1-8B-Instruct',
  Meta_Llama_3_2_1B_Instruct = 'Meta-Llama-3.2-1B-Instruct',
  Meta_Llama_3_2_3B_Instruct = 'Meta-Llama-3.2-3B-Instruct',
  Meta_Llama_3_3_70B_Instruct = 'Meta-Llama-3.3-70B-Instruct',
  Qwen2_5_72B_Instruct = 'Qwen2.5-72B-Instruct',
  Qwen2_5_Coder_32B_Instruct = 'Qwen2.5-Coder-32B-Instruct',
  QwQ_32B_Preview = 'QwQ-32B-Preview',
  // Vision models
  Llama_3_2_11B_Vision_Instruct = 'Llama-3.2-11B-Vision-Instruct',
  Llama_3_2_90B_Vision_Instruct = 'Llama-3.2-90B-Vision-Instruct',
  // Audio models
  Qwen2_Audio_7B_Instruct = 'Qwen2-Audio-7B-Instruct'
}

export interface SambaNovaModel extends GenericSupportedModel {
  id: SambaNovaModelID
  name: string
  tokenLimit: number
  enabled: boolean
}

export const SambaNovaModels: Record<SambaNovaModelID, SambaNovaModel> = {
  [SambaNovaModelID.DeepSeek_R1]: {
    id: SambaNovaModelID.DeepSeek_R1,
    name: 'DeepSeek R1',
    tokenLimit: 16384, // not sure of this token limit
    enabled: true,
  },
  [SambaNovaModelID.DeepSeek_R1_Distill_Llama_70B]: {
    id: SambaNovaModelID.DeepSeek_R1_Distill_Llama_70B,
    name: 'DeepSeek R1 Distill Llama 70B',
    tokenLimit: 16384, // not sure of this token limit
    enabled: true,
  },
  [SambaNovaModelID.Llama_3_1_Tulu_3_405B]: {
    id: SambaNovaModelID.Llama_3_1_Tulu_3_405B,
    name: 'Llama 3.1 Tulu 3 405B',
    tokenLimit: 16384, // not sure of this token limit
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_1_405B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_1_405B_Instruct,
    name: 'Meta Llama 3.1 405B Instruct',
    tokenLimit: 128_000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_1_70B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_1_70B_Instruct,
    name: 'Meta Llama 3.1 70B Instruct',
    tokenLimit: 8_000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_1_8B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_1_8B_Instruct,
    name: 'Meta Llama 3.1 8B Instruct',
    tokenLimit: 128_000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_2_1B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_2_1B_Instruct,
    name: 'Meta Llama 3.2 1B Instruct',
    tokenLimit: 8_000,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_2_3B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_2_3B_Instruct,
    name: 'Meta Llama 3.2 3B Instruct',
    tokenLimit: 4096,
    enabled: true,
  },
  [SambaNovaModelID.Meta_Llama_3_3_70B_Instruct]: {
    id: SambaNovaModelID.Meta_Llama_3_3_70B_Instruct,
    name: 'Meta Llama 3.3 70B Instruct',
    tokenLimit: 128_000,
    enabled: true,
  },
  [SambaNovaModelID.Qwen2_5_72B_Instruct]: {
    id: SambaNovaModelID.Qwen2_5_72B_Instruct,
    name: 'Qwen 2.5 72B Instruct',
    tokenLimit: 131000,
    enabled: true,
  },
  [SambaNovaModelID.Qwen2_5_Coder_32B_Instruct]: {
    id: SambaNovaModelID.Qwen2_5_Coder_32B_Instruct,
    name: 'Qwen 2.5 Coder 32B Instruct',
    tokenLimit: 16384, // not sure of this token limit
    enabled: true,
  },
  [SambaNovaModelID.QwQ_32B_Preview]: {
    id: SambaNovaModelID.QwQ_32B_Preview,
    name: 'QwQ 32B Preview',
    tokenLimit: 16384, // not sure of this token limit
    enabled: true,
  },
  [SambaNovaModelID.Llama_3_2_11B_Vision_Instruct]: {
    id: SambaNovaModelID.Llama_3_2_11B_Vision_Instruct,
    name: 'Llama 3.2 11B Vision Instruct',
    tokenLimit: 16384, // not sure of this token limit
    enabled: true,
  },
  [SambaNovaModelID.Llama_3_2_90B_Vision_Instruct]: {
    id: SambaNovaModelID.Llama_3_2_90B_Vision_Instruct,
    name: 'Llama 3.2 90B Vision Instruct',
    tokenLimit: 16384, // not sure of this token limit
    enabled: true,
  },
  [SambaNovaModelID.Qwen2_Audio_7B_Instruct]: {
    id: SambaNovaModelID.Qwen2_Audio_7B_Instruct,
    name: 'Qwen2 Audio 7B Instruct',
    tokenLimit: 16384, // not sure of this token limit
    enabled: true,
  },
}