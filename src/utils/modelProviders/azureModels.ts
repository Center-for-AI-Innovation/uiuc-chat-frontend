export interface AzureModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
  azureDeploymentModelName: string
  azureDeploymentID?: string // Each deployment has a `model` and  `id`. The deployment ID is needed for making chat requests.
  default?: boolean
  temperature?: number
}

export enum AzureModelID {
  o3 = 'o3',
  o4_mini = 'o4-mini',
  GPT_4o_mini = 'gpt-4o-mini-2024-07-18',
  GPT_4o = 'gpt-4o-2024-08-06',
  GPT_4 = 'gpt-4-0613',
  GPT_4_Turbo = 'gpt-4-turbo-2024-04-09',
  GPT_3_5 = 'gpt-35-turbo-0125',
  GPT_4_1 = 'gpt-4.1',
  GPT_4_1_mini = 'gpt-4.1-mini',
  GPT_4_1_nano = 'gpt-4.1-nano',
  // New GPT-5 family (Azure canonical names may differ per deployment)
  GPT_5 = 'gpt-5',
  GPT_5_mini = 'gpt-5-mini',
  GPT_5_nano = 'gpt-5-nano',
  GPT_5_thinking = 'gpt-5-thinking',
}

export enum AzureDeploymentModelName {
  o3 = 'o3',
  o4_mini = 'o4-mini',
  GPT_4o_mini = 'gpt-4o-mini',
  GPT_4o = 'gpt-4o',
  GPT_4 = 'gpt-4',
  GPT_4_Turbo = 'gpt-4-turbo',
  GPT_3_5 = 'gpt-35-turbo',
  GPT_4_1 = 'gpt-4.1',
  GPT_4_1_mini = 'gpt-4.1-mini',
  GPT_4_1_nano = 'gpt-4.1-nano',
  // New GPT-5 family
  GPT_5 = 'gpt-5',
  GPT_5_mini = 'gpt-5-mini',
  GPT_5_nano = 'gpt-5-nano',
  GPT_5_thinking = 'gpt-5-thinking',
}

export const AzureModels: Record<AzureModelID, AzureModel> = {
  [AzureModelID.o3]: {
    id: AzureModelID.o3,
    name: 'o3 (Reasoning)',
    azureDeploymentModelName: AzureDeploymentModelName.o3,
    tokenLimit: 200000,
    enabled: true,
  },
  [AzureModelID.o4_mini]: {
    id: AzureModelID.o4_mini,
    name: 'o4-mini (Reasoning)',
    azureDeploymentModelName: AzureDeploymentModelName.o4_mini,
    tokenLimit: 200000,
    enabled: true,
  },
  [AzureModelID.GPT_3_5]: {
    id: AzureModelID.GPT_3_5,
    name: 'GPT-3.5',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_3_5,
    tokenLimit: 16385,
    enabled: true,
  },
  [AzureModelID.GPT_4]: {
    id: AzureModelID.GPT_4,
    name: 'GPT-4',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4,
    tokenLimit: 8192,
    enabled: true,
  },
  [AzureModelID.GPT_4_Turbo]: {
    id: AzureModelID.GPT_4_Turbo,
    name: 'GPT-4 Turbo',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4_Turbo,
    tokenLimit: 128000,
    enabled: true,
  },
  [AzureModelID.GPT_4o]: {
    id: AzureModelID.GPT_4o,
    name: 'GPT-4o',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4o,
    tokenLimit: 128000,
    enabled: true,
  },
  [AzureModelID.GPT_4o_mini]: {
    id: AzureModelID.GPT_4o_mini,
    name: 'GPT-4o mini',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4o_mini,
    tokenLimit: 128000,
    enabled: true,
  },
  [AzureModelID.GPT_4_1]: {
    id: AzureModelID.GPT_4_1,
    name: 'GPT-4.1',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4_1,
    tokenLimit: 1047576,
    enabled: true,
  },
  [AzureModelID.GPT_4_1_mini]: {
    id: AzureModelID.GPT_4_1_mini,
    name: 'GPT-4.1 Mini',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4_1_mini,
    tokenLimit: 1047576,
    enabled: true,
  },
  [AzureModelID.GPT_4_1_nano]: {
    id: AzureModelID.GPT_4_1_nano,
    name: 'GPT-4.1 Nano',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_4_1_nano,
    tokenLimit: 1047576,
    enabled: true,
  },
  [AzureModelID.GPT_5]: {
    id: AzureModelID.GPT_5,
    name: 'GPT-5',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_5,
    tokenLimit: 400000,
    enabled: true,
  },
  [AzureModelID.GPT_5_mini]: {
    id: AzureModelID.GPT_5_mini,
    name: 'GPT-5 Mini',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_5_mini,
    tokenLimit: 400000,
    enabled: true,
  },
  [AzureModelID.GPT_5_nano]: {
    id: AzureModelID.GPT_5_nano,
    name: 'GPT-5 Nano',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_5_nano,
    tokenLimit: 400000,
    enabled: true,
  },
  [AzureModelID.GPT_5_thinking]: {
    id: AzureModelID.GPT_5_thinking,
    name: 'GPT-5 Thinking',
    azureDeploymentModelName: AzureDeploymentModelName.GPT_5_thinking,
    tokenLimit: 400000,
    enabled: true,
  },
}
