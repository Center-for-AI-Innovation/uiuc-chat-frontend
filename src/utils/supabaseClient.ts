import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SECRET as string,
)

// CropWizard-specific Supabase client
export const cropwizardSupabase = createClient(
  process.env.CROPWIZARD_SUPABASE_URL as string,
  process.env.CROPWIZARD_SUPABASE_SECRET as string,
)

// Select Supabase client based on course name
export function getSupabaseClient(courseName?: string) {
  if (courseName && courseName.toLowerCase().startsWith('cropwizard')) {
    return cropwizardSupabase
  }
  return supabase
}
