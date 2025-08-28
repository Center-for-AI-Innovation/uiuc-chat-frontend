import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidDiagramProps {
  chart: string
  className?: string
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  chart,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    // Initialize mermaid with configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'monospace',
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current || !chart) return

    const renderDiagram = async () => {
      try {
        setError(null)
        setIsRendered(false)
        
        // Clear the container
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }

        // Generate a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        
        // Create a temporary element to render the diagram
        const tempDiv = document.createElement('div')
        tempDiv.id = id
        tempDiv.className = 'mermaid'
        tempDiv.textContent = chart
        
        if (containerRef.current) {
          containerRef.current.appendChild(tempDiv)
        }

        // Render the diagram
        await mermaid.run({
          nodes: [tempDiv],
        })
        
        setIsRendered(true)
      } catch (err) {
        console.error('Error rendering Mermaid diagram:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
      }
    }

    renderDiagram()
  }, [chart])

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
      {!isRendered && (
        <div className="text-gray-500 text-sm">Rendering diagram...</div>
      )}
    </div>
  )
}