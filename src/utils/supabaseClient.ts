import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SECRET as string,
)

// Create CropWizard-specific Supabase client
export const cropwizardSupabase = createClient(
  process.env.CROPWIZARD_SUPABASE_URL as string,
  process.env.CROPWIZARD_SUPABASE_SECRET as string,
)

/**
 * Get the appropriate Supabase client based on course name
 * @param courseName - The course name to check
 * @returns The appropriate Supabase client
 * 
 * @example
 * // For regular courses
 * const client = getSupabaseClient('cs101')
 * 
 * // For CropWizard courses
 * const client = getSupabaseClient('cropwizard-corn-2024')
 */
export function getSupabaseClient(courseName?: string) {
  if (courseName && courseName.toLowerCase().startsWith('cropwizard')) {
    console.log(`Using CropWizard Supabase client for course: ${courseName}`)
    return cropwizardSupabase
  }
  return supabase
}
