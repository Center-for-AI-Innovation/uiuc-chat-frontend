import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SECRET as string,
)
