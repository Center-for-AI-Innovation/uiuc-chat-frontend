import { supabase } from '@/utils/supabaseClient'

const newsletterUnsubscribe = async (req: any, res: any) => {
  const { email } = req.body

  const { error } = await supabase.from('email-newsletter').upsert(
    [
      {
        email: email,
        'unsubscribed-from-newsletter': true,
      },
    ],
    {
      onConflict: 'email',
    },
  )
  if (error) {
    console.error('error form supabase:', error)
    return res.status(500).json({ success: false, error })
  }
  return res.status(200).json({ success: true })
}

export default newsletterUnsubscribe
