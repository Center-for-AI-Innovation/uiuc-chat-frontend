import { useEffect, useRef, useState } from 'react'
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
  const isMountedRef = useRef(true)

  useEffect(() => {
    // Initialize mermaid with configuration
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'monospace',
      })
    } catch (err) {
      console.error('Failed to initialize Mermaid:', err)
    }
  }, [])

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      // Clean up any existing mermaid elements when component unmounts
      if (containerRef.current) {
        try {
          // Remove all mermaid elements first
          const mermaidElements = containerRef.current.querySelectorAll('.mermaid')
          mermaidElements.forEach(el => {
            try {
              if (el.parentNode) {
                el.parentNode.removeChild(el)
              }
            } catch (e) {
              // Ignore cleanup errors
            }
          })
          
          // Then clear the container
          containerRef.current.innerHTML = ''
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || !chart) return

    // Don't render during streaming to avoid cursor character issues
    if (isStreaming) {
      return
    }

    const renderDiagram = async () => {
      let tempDiv: HTMLDivElement | null = null
      
      try {
        setError(null)
        setIsRendered(false)
        
        // Clean the chart content - remove streaming cursor and other problematic characters
        const cleanChart = chart
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
          .trim()

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

        // Check if container still exists before proceeding
        if (!containerRef.current || !isMountedRef.current) {
          return
        }

        // Generate a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        
        // Clear the container first
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }
        
        // Create a temporary element to render the diagram
        tempDiv = document.createElement('div')
        tempDiv.id = id
        tempDiv.className = 'mermaid'
        tempDiv.textContent = cleanChart
        
        // Check if container still exists before appending
        if (containerRef.current && isMountedRef.current) {
          containerRef.current.appendChild(tempDiv)
        } else {
          return
        }

        // Check if container and tempDiv still exist before rendering
        if (!containerRef.current || !tempDiv || !tempDiv.parentNode || !isMountedRef.current) {
          return
        }

        try {
          // Use the safer render approach directly instead of run
          const { svg } = await mermaid.render(id, cleanChart)
          
          if (isMountedRef.current && tempDiv && containerRef.current) {
            tempDiv.innerHTML = svg
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
    }

    renderDiagram()

    // Cleanup function
    return () => {
      // Mark as unmounted
      isMountedRef.current = false
      
      // Clean up container
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [chart, isStreaming])

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
      {!isRendered && !isStreaming && (
        <div className="text-gray-500 text-sm">Rendering diagram...</div>
      )}
    </div>
  )
}