import { useEffect, useRef, useState, useCallback } from 'react'
import mermaid from 'mermaid'

interface MermaidDiagramProps {
  chart: string
  className?: string
  isStreaming?: boolean
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  chart,
  className = '',
  isStreaming = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRendered, setIsRendered] = useState(false)
  const [svgContent, setSvgContent] = useState<string>('')
  const isMountedRef = useRef(true)
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initialize mermaid with configuration
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'monospace',
        logLevel: 1, // Only show errors
      })
    } catch (err) {
      console.error('Failed to initialize Mermaid:', err)
    }
  }, [])

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [])

  // Clean chart content
  const cleanChartContent = useCallback((chartText: string) => {
    return chartText
      .replace(/▍/g, '') // Remove streaming cursor
      .replace(/\u200B/g, '') // Remove zero-width space
      .replace(/[\u200C\u200D\uFEFF]/g, '') // Remove other invisible characters
      .replace(/[^\x00-\x7F]/g, (char) => {
        // Replace non-ASCII characters with their closest ASCII equivalent or remove them
        const replacements: { [key: string]: string } = {
          '\u2013': '-', // en dash
          '\u2014': '-', // em dash
          '\u201C': '"', // left double quote
          '\u201D': '"', // right double quote
          '\u2018': "'", // left single quote
          '\u2019': "'", // right single quote
          '\u2026': '...', // ellipsis
        }
        return replacements[char] || char
      })
      // Only normalize multiple spaces, preserve newlines and other whitespace
      .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs, but keep newlines
      .trim()
  }, [])

  // Render diagram in a separate function
  const renderDiagram = useCallback(async (chartText: string) => {
    try {
      setError(null)
      setIsRendered(false)
      setSvgContent('')
      
      const cleanChart = cleanChartContent(chartText)

      // Don't render if chart is empty after cleaning
      if (!cleanChart) {
        if (isMountedRef.current) {
          setError('Empty or invalid Mermaid diagram')
        }
        return
      }

      // Basic validation - check if it looks like a mermaid diagram
      const mermaidKeywords = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitgraph']
      const hasMermaidKeyword = mermaidKeywords.some(keyword => cleanChart.toLowerCase().includes(keyword))
      
      if (!hasMermaidKeyword) {
        if (isMountedRef.current) {
          setError('Invalid Mermaid diagram syntax')
        }
        return
      }

      // Generate a unique ID for this diagram
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`

      try {
        // Use the safer render approach directly instead of run
        const { svg } = await mermaid.render(id, cleanChart)
        
        if (isMountedRef.current) {
          setSvgContent(svg)
          setIsRendered(true)
        }
      } catch (mermaidErr) {
        console.error('Mermaid render failed:', mermaidErr)
        
        if (isMountedRef.current) {
          // Show the actual error message to help with debugging
          const errorMessage = mermaidErr instanceof Error ? mermaidErr.message : 'Failed to render Mermaid diagram'
          setError(`Mermaid parsing error: ${errorMessage}`)
        }
      }
      
    } catch (err) {
      console.error('Error rendering Mermaid diagram:', err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
      }
    }
  }, [cleanChartContent])

  useEffect(() => {
    if (!chart) return

    // Don't render during streaming to avoid cursor character issues
    if (isStreaming) {
      return
    }

    // Clear any existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current)
    }

    // Use a timeout to debounce rendering and avoid rapid re-renders
    renderTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        renderDiagram(chart)
      }
    }, 100)

    // Cleanup function
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current)
      }
    }
  }, [chart, isStreaming, renderDiagram])

  if (error) {
    return (
      <div className={`mermaid-error p-4 border border-red-300 bg-red-50 rounded ${className}`}>
        <p className="text-red-600 font-medium">Error rendering Mermaid diagram:</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <details className="mt-2">
          <summary className="text-red-600 cursor-pointer text-sm">Show chart code</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
            {chart}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className={`mermaid-container ${className}`}
      style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: isRendered ? 'auto' : '100px'
      }}
    >
      {isStreaming && (
        <div className="text-gray-500 text-sm">Waiting for complete diagram...</div>
      )}
      {!isRendered && !isStreaming && !error && (
        <div className="text-gray-500 text-sm">Rendering diagram...</div>
      )}
      {isRendered && svgContent && (
        <div 
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{ width: '100%', height: 'auto' }}
        />
      )}
      {error && (
        <div className="text-red-500 text-sm">
          <div>Failed to render diagram</div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs">Show error details</summary>
            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {error}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}