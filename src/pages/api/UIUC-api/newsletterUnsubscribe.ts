import { db } from '~/db/dbClient'
import { emailNewsletter } from '~/db/schema'

const newsletterUnsubscribe = async (req: any, res: any) => {
  const { email } = req.body

  try{
    const result = await db.insert(emailNewsletter).values({
      email: email,
      unsubscribedFromNewsletter: true,
  }).onConflictDoUpdate({
    target: [emailNewsletter.email],
    set: {
      unsubscribedFromNewsletter: true,
    },
  })
  } catch (error: any) {
    console.error('error form supabase:', error)
    return res.status(500).json({ success: false, error: error })
  }
  return res.status(200).json({ success: true })
}

export default newsletterUnsubscribe
