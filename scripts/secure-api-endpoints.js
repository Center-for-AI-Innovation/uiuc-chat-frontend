const fs = require('fs')
const path = require('path')

// API endpoints that should remain public (no authentication required)
const PUBLIC_ENDPOINTS = [
  'healthcheck.ts',
  'UIUC-api/isSignedIn.ts', // This is used for auth checking
]

// API endpoints that are already secured or don't need securing
const SKIP_ENDPOINTS = [
  'chat-api/keys/fetch.ts', // Already has JWT handling
  'chat-api/keys/generate.ts', // Already has JWT handling
  'chat-api/keys/rotate.ts', // Already has JWT handling
  'chat-api/keys/delete.ts', // Already has JWT handling
  'chat-api/keys/validate.ts', // Already has JWT handling
  'conversation.ts', // Already secured
  'models.ts', // Already secured
  'materialsTable/fetchFailedDocuments.ts', // Already secured
  'documentGroups.ts', // Already secured
]

function shouldSkipEndpoint(filePath) {
  const relativePath = filePath.replace(/.*\/api\//, '')
  return (
    SKIP_ENDPOINTS.some((skip) => relativePath.includes(skip)) ||
    PUBLIC_ENDPOINTS.some((public) => relativePath.includes(public))
  )
}

function secureApiEndpoint(filePath) {
  if (shouldSkipEndpoint(filePath)) {
    console.log(`Skipping ${filePath}`)
    return
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8')

    // Check if already secured
    if (
      content.includes('withAuth') ||
      content.includes('AuthenticatedRequest')
    ) {
      console.log(`Already secured: ${filePath}`)
      return
    }

    // Add import for auth middleware
    if (!content.includes('withAuth')) {
      const importMatch = content.match(/import.*from ['"]next['"]/)
      if (importMatch) {
        const importLine = importMatch[0]
        const newImport = importLine.replace(
          /import.*from ['"]next['"]/,
          `import { type NextApiRequest, type NextApiResponse } from 'next'\nimport { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'`,
        )
        content = content.replace(importLine, newImport)
      } else {
        // Add import at the top
        content = `import { type NextApiRequest, type NextApiResponse } from 'next'\nimport { withAuth, AuthenticatedRequest } from '~/utils/authMiddleware'\n${content}`
      }
    }

    // Replace NextApiRequest with AuthenticatedRequest in function parameters
    content = content.replace(/NextApiRequest/g, 'AuthenticatedRequest')

    // Find the export default function handler
    const handlerMatch = content.match(
      /export default async function handler\s*\(/,
    )
    if (handlerMatch) {
      // Convert to named function and add withAuth wrapper
      content = content.replace(
        /export default async function handler\s*\(/,
        'async function handler(',
      )

      // Add export default withAuth(handler) at the end
      if (!content.includes('export default withAuth(handler)')) {
        content = content.replace(
          /^}$/m,
          '}\n\nexport default withAuth(handler)',
        )
      }
    }

    // Write the updated content back
    fs.writeFileSync(filePath, content)
    console.log(`Secured: ${filePath}`)
  } catch (error) {
    console.error(`Error securing ${filePath}:`, error.message)
  }
}

function findApiEndpoints(dir) {
  const endpoints = []

  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir)

    for (const file of files) {
      const filePath = path.join(currentDir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        traverse(filePath)
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        endpoints.push(filePath)
      }
    }
  }

  traverse(dir)
  return endpoints
}

// Main execution
const apiDir = path.join(__dirname, '..', 'src', 'pages', 'api')
const endpoints = findApiEndpoints(apiDir)

console.log(`Found ${endpoints.length} API endpoints to process`)

endpoints.forEach(secureApiEndpoint)

console.log('API endpoint securing complete!')
