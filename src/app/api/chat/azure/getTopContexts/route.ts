import { NextResponse } from 'next/server';
import { OpenAIAzureChat } from '@/utils/modelProviders/OpenAIAzureChat';
import { validateApiKey } from '@/utils/server/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, api_key, course_name } = body;

    // Validate the API key
    const validationResult = await validateApiKey(api_key, course_name);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.message },
        { status: 401 }
      );
    }

    const azureClient = new OpenAIAzureChat();
    const contexts = await azureClient.getTopContexts(messages);

    return NextResponse.json({ contexts });
  } catch (error: any) {
    console.error('Error in getTopContexts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}