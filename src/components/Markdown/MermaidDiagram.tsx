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

    // Add global error handler for Mermaid DOM errors
    const originalRemoveChild = Node.prototype.removeChild
    Node.prototype.removeChild = function(child) {
      try {
        return originalRemoveChild.call(this, child)
      } catch (error) {
        // Suppress removeChild errors from Mermaid
        if (error instanceof Error && error.name === 'NotFoundError' && error.message.includes('removeChild')) {
          console.warn('Suppressed Mermaid DOM cleanup error:', error.message)
          return child
        }
        throw error
      }
    }

    // Cleanup function
    return () => {
      // Restore original removeChild
      Node.prototype.removeChild = originalRemoveChild
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
      let renderAbortController: AbortController | null = null
      
      try {
        setError(null)
        setIsRendered(false)
        
        // Create an abort controller to cancel rendering if component unmounts
        renderAbortController = new AbortController()
        
        // Clear the container
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }

        // Clean the chart content - remove streaming cursor and other problematic characters
        const cleanChart = chart
          .replace(/▍/g, '') // Remove streaming cursor
          .replace(/\u200B/g, '') // Remove zero-width space
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

        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 10))

        // Check if container and tempDiv still exist before rendering
        if (!containerRef.current || !tempDiv || !tempDiv.parentNode || !isMountedRef.current) {
          return
        }

        // Use a timeout to prevent hanging renders
        const renderTimeout = setTimeout(() => {
          if (renderAbortController) {
            renderAbortController.abort()
          }
        }, 10000) // 10 second timeout

        try {
          // Use the safer render approach directly instead of run
          const { svg } = await mermaid.render(id, cleanChart)
          
          clearTimeout(renderTimeout)
          
          if (isMountedRef.current && tempDiv && containerRef.current) {
            tempDiv.innerHTML = svg
            setIsRendered(true)
          }
        } catch (mermaidErr) {
          clearTimeout(renderTimeout)
          
          console.error('Mermaid render failed:', mermaidErr)
          
          if (isMountedRef.current) {
            setError('Failed to render Mermaid diagram')
          }
        }
        
      } catch (err) {
        console.error('Error rendering Mermaid diagram:', err)
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      } finally {
        // Always clean up
        if (renderAbortController) {
          renderAbortController.abort()
        }
      }
    }

    renderDiagram()

    // Cleanup function
    return () => {
      // Abort any ongoing rendering
      if (containerRef.current) {
        try {
          // Remove all mermaid elements
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
          
          // Clear the container
          containerRef.current.innerHTML = ''
        } catch (err) {
          // Ignore cleanup errors
        }
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