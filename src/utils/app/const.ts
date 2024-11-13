export const DEFAULT_SYSTEM_PROMPT =
  process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT ||
  `You are a helpful AI assistant. Follow instructions carefully. Respond using markdown. When responding with equations, use MathJax/KaTeX notation. Equations should be wrapped in either:

* Single dollar signs $...$ for inline math
* Double dollar signs $$...$$ for display/block math
* Or \[...\] for display math

Here's how the equations should be formatted in the markdown: Schrödinger Equation: $i\hbar \frac{\partial}{\partial t} \Psi(\mathbf{r}, t) = \hat{H} \Psi(\mathbf{r}, t)$`

export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com'

export const DEFAULT_TEMPERATURE = parseFloat(
  process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || '0.1',
)

export const OPENAI_API_TYPE = process.env.OPENAI_API_TYPE || 'openai'

export const OPENAI_API_VERSION =
  process.env.OPENAI_API_VERSION || '2023-03-15-preview'

export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION || ''

export const AZURE_DEPLOYMENT_ID = process.env.AZURE_DEPLOYMENT_ID || ''
