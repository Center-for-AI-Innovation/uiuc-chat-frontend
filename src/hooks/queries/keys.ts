// Shared React Query key factory.
// Keep key shapes identical to existing keys to avoid cache regressions.
export const queryKeys = {
  /* -------------------------------------------------------------------------- */
  /*                      Course metadata and existence                      */
  /* -------------------------------------------------------------------------- */
  allCourseData: (courseName: string) => ['allCourseData', courseName] as const,
  allCourseMetadata: (currUserEmail?: string) =>
    currUserEmail === undefined
      ? (['allCourseMetadata'] as const)
      : (['allCourseMetadata', currUserEmail] as const),
  allCourseNames: () => ['allCourseNames'] as const,
  courseExists: (courseName?: string) =>
    courseName === undefined
      ? (['courseExists'] as const)
      : (['courseExists', courseName] as const),
  courseMetadata: (courseName: string) =>
    ['courseMetadata', courseName] as const,

  /* -------------------------------------------------------------------------- */
  /*                          Conversation and chat                          */
  /* -------------------------------------------------------------------------- */
  conversationHistory: (courseName: string, searchTerm = '') =>
    ['conversationHistory', courseName, searchTerm] as const,
  defaultPostPrompt: () => ['defaultPostPrompt'] as const,
  lastConversation: (courseName: string, userEmail?: string) =>
    ['lastConversation', courseName, userEmail] as const,

  /* -------------------------------------------------------------------------- */
  /*                                 Folders                                 */
  /* -------------------------------------------------------------------------- */
  folders: (courseName: string) => ['folders', courseName] as const,

  /* -------------------------------------------------------------------------- */
  /*                             Documents and materials                     */
  /* -------------------------------------------------------------------------- */
  docsInProgress: (courseName: string) =>
    ['docsInProgress', courseName] as const,
  documentGroups: (courseName: string) =>
    ['documentGroups', courseName] as const,
  documents: (courseName: string, page?: number) =>
    page === undefined
      ? (['documents', courseName] as const)
      : (['documents', courseName, page] as const),
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
  projectDocumentCount: (courseName: string) =>
    ['projectDocumentCount', courseName] as const,
  successDocs: (courseName: string) => ['successDocs', courseName] as const,

  /* -------------------------------------------------------------------------- */
  /*                             API keys and provider settings               */
  /* -------------------------------------------------------------------------- */
  chatApiKey: (courseName: string) => ['chatApiKey', courseName] as const,
  n8nApiKey: (courseName: string) => ['n8nApiKey', courseName] as const,
  presignedUrlDownload: (filePath?: string, courseName?: string) =>
    ['presignedUrl', 'download', filePath, courseName] as const,
  projectLLMProviders: (projectName: string) =>
    ['projectLLMProviders', projectName] as const,
  tools: (n8nApiKey?: string) => ['tools', n8nApiKey] as const,

  /* -------------------------------------------------------------------------- */
  /*                             Analytics and visualization                 */
  /* -------------------------------------------------------------------------- */
  conversationStats: (courseName: string, fromDate?: string, toDate?: string) =>
    ['conversationStats', courseName, fromDate, toDate] as const,
  modelUsageCounts: (courseName: string) =>
    ['modelUsageCounts', courseName] as const,
  nomicMapForQueries: (courseName: string) =>
    ['nomicMapForQueries', courseName] as const,
  projectStats: (courseName: string) => ['projectStats', courseName] as const,
  weeklyTrends: (courseName: string) => ['weeklyTrends', courseName] as const,

  /* -------------------------------------------------------------------------- */
  /*                                 Maintenance                             */
  /* -------------------------------------------------------------------------- */
  maintenanceDetails: () => ['maintenanceDetails'] as const,
  maintenanceMode: () => ['maintenanceMode'] as const,
}

export const mutationKeys = {
  /* -------------------------------------------------------------------------- */
  /*                         Folder and conversation mutations               */
  /* -------------------------------------------------------------------------- */
  createFolder: (userEmail: string, courseName: string) =>
    ['createFolder', userEmail, courseName] as const,
  deleteAllConversations: (userEmail: string, courseName: string) =>
    ['deleteAllConversations', userEmail, courseName] as const,
  deleteConversation: (userEmail: string, courseName: string) =>
    ['deleteConversation', userEmail, courseName] as const,
  deleteFolder: (userEmail: string, courseName: string) =>
    ['deleteFolder', userEmail, courseName] as const,
  updateConversation: (userEmail: string, courseName: string) =>
    ['updateConversation', userEmail, courseName] as const,
  updateFolder: (userEmail: string, courseName: string) =>
    ['updateFolder', userEmail, courseName] as const,

  /* -------------------------------------------------------------------------- */
  /*                             Project and metadata                        */
  /* -------------------------------------------------------------------------- */
  createProject: () => ['createProject'] as const,
  setCourseMetadata: (courseName: string) =>
    ['setCourseMetadata', courseName] as const,

  /* -------------------------------------------------------------------------- */
  /*                             API keys and providers                      */
  /* -------------------------------------------------------------------------- */
  activateWorkflow: (n8nApiKey: string) =>
    ['activateWorkflow', n8nApiKey] as const,
  createApiKey: () => ['createApiKey'] as const,
  rotateApiKey: () => ['rotateApiKey'] as const,
  updateN8nApiKey: () => ['updateN8nApiKey'] as const,

  /* -------------------------------------------------------------------------- */
  /*                             Upload and ingest                           */
  /* -------------------------------------------------------------------------- */
  chatFileUpload: () => ['chatFileUpload'] as const,
  ingest: () => ['ingest'] as const,
  ingestCanvas: () => ['ingestCanvas'] as const,
  uploadToS3: () => ['uploadToS3'] as const,

  /* -------------------------------------------------------------------------- */
  /*                             Conversation operations                     */
  /* -------------------------------------------------------------------------- */
  deleteMessages: (userEmail: string, courseName: string) =>
    ['deleteMessages', userEmail, courseName] as const,
  downloadConvoHistory: () => ['downloadConvoHistory'] as const,
  downloadConversationHistory: () => ['downloadConversationHistory'] as const,
  exportConversation: () => ['exportConversation'] as const,
  logConversation: (courseName: string) =>
    ['logConversation', courseName] as const,
  queryRewrite: () => ['queryRewrite'] as const,
  routeChat: () => ['routeChat'] as const,

  /* -------------------------------------------------------------------------- */
  /*                             Context/tool fetch helpers                   */
  /* -------------------------------------------------------------------------- */
  fetchContexts: () => ['fetchContexts'] as const,
  fetchContextsForChat: () => ['fetchContextsForChat'] as const,
  fetchMQRContexts: () => ['fetchMQRContexts'] as const,
}
