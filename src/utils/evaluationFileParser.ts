/**
 * Utility to parse CSV and JSON files for evaluation question-answer pairs
 */

export interface ParsedQAPair {
  question: string
  answer: string
}

export interface ParseResult {
  pairs: ParsedQAPair[]
  errors: string[]
}

/**
 * Parse CSV file with question-answer pairs
 * Expected format: question,answer (header optional)
 */
export async function parseCSVFile(file: File): Promise<ParseResult> {
  const text = await file.text()
  const lines = text.split('\n').filter((line) => line.trim())
  const pairs: ParsedQAPair[] = []
  const errors: string[] = []

  // Check if first line is header
  const startIndex = lines[0]?.toLowerCase().includes('question') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    // Handle CSV with quotes and commas
    const parts = parseCSVLine(line)
    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: Expected at least 2 columns (question, answer)`)
      continue
    }

    const question = parts[0]?.trim() || ''
    const answer = parts.slice(1).join(',').trim() // Join remaining parts as answer

    if (!question || !answer) {
      errors.push(`Line ${i + 1}: Question and answer cannot be empty`)
      continue
    }

    pairs.push({ question, answer })
  }

  return { pairs, errors }
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current)
  return result
}

/**
 * Parse JSON file with question-answer pairs
 * Expected formats:
 * - Array: [{question: "...", answer: "..."}, ...]
 * - Object: {question1: "answer1", question2: "answer2", ...}
 */
export async function parseJSONFile(file: File): Promise<ParseResult> {
  const text = await file.text()
  const pairs: ParsedQAPair[] = []
  const errors: string[] = []

  try {
    const data = JSON.parse(text)

    if (Array.isArray(data)) {
      // Array format: [{question: "...", answer: "..."}, ...]
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        if (typeof item !== 'object' || item === null) {
          errors.push(`Item ${i + 1}: Expected object`)
          continue
        }

        const question = item.question || item.q || ''
        const answer = item.answer || item.a || item.ground_truth || ''

        if (!question || !answer) {
          errors.push(`Item ${i + 1}: Missing question or answer`)
          continue
        }

        pairs.push({ question: String(question), answer: String(answer) })
      }
    } else if (typeof data === 'object') {
      // Object format: {question1: "answer1", question2: "answer2", ...}
      for (const [question, answer] of Object.entries(data)) {
        if (typeof answer !== 'string') {
          errors.push(`Question "${question}": Answer must be a string`)
          continue
        }
        pairs.push({ question, answer })
      }
    } else {
      errors.push('JSON must be an array or object')
    }
  } catch (error) {
    errors.push(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }

  return { pairs, errors }
}

/**
 * Parse file based on its type
 */
export async function parseEvaluationFile(file: File): Promise<ParseResult> {
  const fileName = file.name.toLowerCase()
  
  if (fileName.endsWith('.csv')) {
    return parseCSVFile(file)
  } else if (fileName.endsWith('.json')) {
    return parseJSONFile(file)
  } else {
    return {
      pairs: [],
      errors: ['Unsupported file type. Please upload a CSV or JSON file.'],
    }
  }
}

