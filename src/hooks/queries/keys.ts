// Shared React Query key factory.
// Keep key shapes identical to existing keys to avoid cache regressions.
export const queryKeys = {
  allCourseNames: () => ['allCourseNames'] as const,
  allCourseMetadata: (currUserEmail?: string) =>
    currUserEmail === undefined
      ? (['allCourseMetadata'] as const)
      : (['allCourseMetadata', currUserEmail] as const),
  courseMetadata: (courseName: string) =>
    ['courseMetadata', courseName] as const,
  courseExists: (courseName?: string) =>
    courseName === undefined
      ? (['courseExists'] as const)
      : (['courseExists', courseName] as const),
  folders: (courseName: string) => ['folders', courseName] as const,
  conversationHistory: (courseName: string, searchTerm = '') =>
    ['conversationHistory', courseName, searchTerm] as const,
  documentGroups: (courseName: string) =>
    ['documentGroups', courseName] as const,
  documents: (courseName: string, page?: number) =>
    page === undefined
      ? (['documents', courseName] as const)
      : (['documents', courseName, page] as const),
  projectLLMProviders: (projectName: string) =>
    ['projectLLMProviders', projectName] as const,
  n8nApiKey: (courseName: string) => ['n8nApiKey', courseName] as const,
  chatApiKey: (courseName: string) => ['chatApiKey', courseName] as const,
  tools: (n8nApiKey: string) => ['tools', n8nApiKey] as const,
  nomicMapForQueries: (courseName: string) =>
    ['nomicMapForQueries', courseName] as const,
  weeklyTrends: (courseName: string) => ['weeklyTrends', courseName] as const,
  modelUsageCounts: (courseName: string) =>
    ['modelUsageCounts', courseName] as const,
  conversationStats: (courseName: string, fromDate?: string, toDate?: string) =>
    ['conversationStats', courseName, fromDate, toDate] as const,
  projectStats: (courseName: string) => ['projectStats', courseName] as const,
  maintenanceDetails: () => ['maintenanceDetails'] as const,
  maintenanceMode: () => ['maintenanceMode'] as const,
  successDocs: (courseName: string) => ['successDocs', courseName] as const,
  docsInProgress: (courseName: string) =>
    ['docsInProgress', courseName] as const,
  failedDocuments: (
    courseName: string,
    from: number,
    to: number,
    filterKey: string,
    filterValue: string,
    sortColumn: string,
    sortDirection: string,
  ) =>
    [
      'failedDocuments',
      courseName,
      from,
      to,
      filterKey,
      filterValue,
      sortColumn,
      sortDirection,
    ] as const,
  projectMaterials: (
    courseName: string,
    from: number,
    to: number,
    filterKey: string,
    filterValue: string,
    sortColumn: string,
    sortDirection: string,
  ) =>
    [
      'documents',
      courseName,
      from,
      to,
      filterKey,
      filterValue,
      sortColumn,
      sortDirection,
    ] as const,
  allCourseData: (courseName: string) => ['allCourseData', courseName] as const,
  presignedUrlDownload: (filePath?: string, courseName?: string) =>
    ['presignedUrl', 'download', filePath, courseName] as const,
  projectDocumentCount: (courseName: string) =>
    ['projectDocumentCount', courseName] as const,
  lastConversation: (courseName: string, userEmail?: string) =>
    ['lastConversation', courseName, userEmail] as const,
  defaultPostPrompt: () => ['defaultPostPrompt'] as const,
}

export const mutationKeys = {
  createFolder: (userEmail: string, courseName: string) =>
    ['createFolder', userEmail, courseName] as const,
  updateFolder: (userEmail: string, courseName: string) =>
    ['updateFolder', userEmail, courseName] as const,
  deleteFolder: (userEmail: string, courseName: string) =>
    ['deleteFolder', userEmail, courseName] as const,
  deleteConversation: (userEmail: string, courseName: string) =>
    ['deleteConversation', userEmail, courseName] as const,
  deleteAllConversations: (userEmail: string, courseName: string) =>
    ['deleteAllConversations', userEmail, courseName] as const,
  updateConversation: (userEmail: string, courseName: string) =>
    ['updateConversation', userEmail, courseName] as const,
  createProject: () => ['createProject'] as const,
  createApiKey: () => ['createApiKey'] as const,
  rotateApiKey: () => ['rotateApiKey'] as const,
  updateN8nApiKey: () => ['updateN8nApiKey'] as const,
  activateWorkflow: (n8nApiKey: string) =>
    ['activateWorkflow', n8nApiKey] as const,
  chatFileUpload: () => ['chatFileUpload'] as const,
  setCourseMetadata: (courseName: string) =>
    ['setCourseMetadata', courseName] as const,
  logConversation: (courseName: string) =>
    ['logConversation', courseName] as const,
  ingestCanvas: () => ['ingestCanvas'] as const,
  downloadConvoHistory: () => ['downloadConvoHistory'] as const,
  downloadConversationHistory: () => ['downloadConversationHistory'] as const,
  deleteMessages: (userEmail: string, courseName: string) =>
    ['deleteMessages', userEmail, courseName] as const,
  fetchContextsForChat: () => ['fetchContextsForChat'] as const,
  fetchMQRContexts: () => ['fetchMQRContexts'] as const,
  fetchContexts: () => ['fetchContexts'] as const,
  ingest: () => ['ingest'] as const,
  uploadToS3: () => ['uploadToS3'] as const,
  routeChat: () => ['routeChat'] as const,
  queryRewrite: () => ['queryRewrite'] as const,
  exportConversation: () => ['exportConversation'] as const,
}
