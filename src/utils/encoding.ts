import { Tiktoken } from '@dqbd/tiktoken';
import cl100k_base from '@dqbd/tiktoken/encoders/cl100k_base.json';

// Use 'let' instead of 'const' since 'encoding' will be reassigned
let encoding: Tiktoken | null = null;

export const initializeEncoding = (): void => {
  if (!encoding) {
    try {
      // Create a new encoding instance
      encoding = new Tiktoken(
        cl100k_base.bpe_ranks,
        cl100k_base.special_tokens,
        cl100k_base.pat_str
      );
    } catch (error) {
      console.error('Failed to initialize encoding:', error);
      throw error;
    }
  }
};

// Export Tiktoken type and encoding instance for use in other modules
export { Tiktoken, encoding };
