export interface CourseDocument {
  id: string | number | undefined
  course_name: string
  readable_filename: string
  url: string
  s3_path: string
  created_at: string
  base_url: string
  doc_groups?: string[]
  error: string
}

export interface DocumentGroup {
  name: string
  enabled: boolean
  course_name: string
  doc_count: number
}

export type FailedDocument = Omit<CourseDocument, 'id'> & {
  id: string | number
}

export interface DocInProgress {
  readable_filename: string
  base_url: string
  url: string
}

export interface SuccessDoc {
  readable_filename: string
  base_url: string
  url: string
}
