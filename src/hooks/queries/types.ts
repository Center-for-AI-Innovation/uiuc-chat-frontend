// ============================================================
// Shared types for React Query hooks (src/hooks/queries/)
// ============================================================

// ----- Presigned URL -----

export type DownloadPresignedUrlRequest = {
  filePath: string
  courseName?: string
  page?: string
  fileName?: string
}

// ----- Create Project -----

export interface CreateProjectParams {
  project_name: string
  project_description: string | undefined
  project_owner_email: string
  is_private?: boolean
}

// ----- Upload / Ingest -----

export type UploadToS3Request = {
  file: File
  uniqueFileName: string
  courseName: string
  user_id?: string
  uploadType?: 'chat' | 'document-group'
}

export interface PresignedPostResponse {
  post: {
    url: string
    fields: { [key: string]: string }
  }
}

export type IngestRequest = {
  uniqueFileName: string
  courseName: string
  readableFilename: string
}

export type IngestResponse = {
  task_id?: string
  error?: string
}

export type IngestCanvasRequest = {
  courseName: string
  canvas_url: string
  selectedCanvasOptions: string[]
}

export type IngestCanvasResponse = {
  success?: boolean
  message?: string
  error?: string
}

// ----- Chat File Upload -----

export type ChatFileUploadRequest = {
  conversationId: string
  courseName: string
  user_id: string
  s3Key: string
  fileName: string
  fileType: string
  model?: string
}

export type ChatFileUploadResponse = {
  success?: boolean
  fileUploadId?: string
  message?: string
  error?: string
  details?: string
  chunks_created?: number
}

// ----- Context Fetching -----

export interface FetchContextsParams {
  course_name: string
  user_id: string
  search_query: string
  token_limit?: number
  doc_groups?: string[]
  conversation_id?: string
}

export interface FetchContextsForChatParams {
  course_name: string
  search_query: string
  token_limit?: number
  doc_groups?: string[]
  conversation_id?: string
}

export interface FetchMQRContextsParams {
  course_name: string
  search_query: string
  token_limit?: number
  doc_groups?: string[]
  conversation_id: string
}

// ----- Download / Export -----

export type DownloadConvoHistoryRequest = {
  projectName: string
}

export type DownloadConvoHistoryResult = {
  message: string
}

export interface ExportResult {
  message: string
  s3_path?: string
}

export interface DownloadResult {
  message: string
}

// ----- Course Metadata -----

export interface FetchCourseMetadataVariables {
  courseName: string
}

export interface UseFetchCourseMetadataOptions
  extends FetchCourseMetadataVariables {
  enabled?: boolean
}

// ----- Course Exists -----

export interface FetchCourseExistsVariables {
  courseName: string
}

export interface UseFetchCourseExistsOptions
  extends FetchCourseExistsVariables {
  enabled?: boolean
}

export interface CourseExistsResponse {
  exists: boolean
}

// ----- Course Names -----

export interface UseFetchAllCourseNamesOptions {
  enabled?: boolean
}

export interface AllCourseNamesResponse {
  all_course_names: string[]
}

// ----- Course Data -----

export interface AllCourseDataResponse {
  distinct_files: any
}

// ----- LLM Providers -----

export interface FetchLLMProvidersVariables {
  projectName: string
}

export interface UseFetchLLMProvidersOptions
  extends FetchLLMProvidersVariables {
  enabled?: boolean
}

// ----- Project Materials / Documents -----

export interface ProjectMaterialsResponse {
  final_docs?: import().CourseDocument[]
  total_count?: number
}

export interface FailedDocument {
  id: string | number
  course_name: string
  readable_filename: string
  s3_path: string
  url: string
  base_url: string
  created_at: string
  error: string
}

export interface FailedDocumentsResponse {
  final_docs: FailedDocument[]
  total_count: number
  recent_fail_count: number
}

export interface DocInProgress {
  readable_filename: string
  base_url: string
  url: string
}

export interface DocsInProgressResponse {
  documents: DocInProgress[]
}

export interface SuccessDoc {
  readable_filename: string
  base_url: string
  url: string
}

// ----- Maintenance -----

export interface UseFetchMaintenanceModeOptions {
  enabled?: boolean
}

export interface MaintenanceModeResponse {
  isMaintenanceMode: boolean
}

export interface UseFetchMaintenanceDetailsOptions {
  enabled?: boolean
}

export interface MaintenanceDetailsResponse {
  isMaintenanceMode: boolean
  maintenanceBodyText: string
  maintenanceTitleText: string
}

// ----- Analytics / Stats -----

export interface ProjectStatsResponse {
  total_conversations: number
  total_messages: number
  unique_users: number
  avg_conversations_per_user: number
  avg_messages_per_user: number
  avg_messages_per_conversation: number
}

export interface ConversationStatsResponse {
  per_day: { [date: string]: number }
  per_hour: { [hour: string]: number }
  per_weekday: { [day: string]: number }
  heatmap: { [day: string]: { [hour: string]: number } }
  total_count?: number
}

export interface ModelUsage {
  model_name: string
  count: number
  percentage: number
}

export interface WeeklyTrend {
  current_week_value: number
  metric_name: string
  percentage_change: number
  previous_week_value: number
}

// ----- Nomic Map -----

export interface NomicMapData {
  map_id: string
  map_link: string
}

// ----- Internal (useUpdateProjectLLMProviders) -----

export type PendingPromise = {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}
