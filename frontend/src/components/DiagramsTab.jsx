import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Maximize2, Minimize2, Download, RefreshCw, ZoomIn, ZoomOut, Check, Info, Award } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Plus Jakarta Sans',
});

function MermaidRenderer({ id, syntax }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setError(null);
        // Ensure unique id per render
        const uniqueId = `mermaid-${id}-${Math.floor(Math.random() * 10000)}`;
        const { svg } = await mermaid.render(uniqueId, syntax);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setError('Failed to render diagram syntax cleanly.');
        }
      }
    };

    if (syntax) {
      renderDiagram();
    }

    return () => {
      isMounted = false;
    };
  }, [id, syntax]);

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>{error}</p>
        <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'left', overflow: 'auto' }}>
          {syntax}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
    />
  );
}

export default function DiagramsTab({ kit, onRegenerateDiagrams }) {
  const diagrams = kit?.diagrams || [];
  const [fullscreenDiagram, setFullscreenDiagram] = useState(null);
  const [zoomLevel, setZoomLevel] = useState({});

  const handleZoom = (id, delta) => {
    setZoomLevel((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(0.6, Math.min(2.0, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleDownloadSVG = (diagram) => {
    const element = document.getElementById(`diagram-box-${diagram.id}`);
    const svg = element?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagram.title.replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            Visual Concepts & Architecture Diagrams
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            High-clarity Mermaid.js flowcharts, mind maps, and block diagrams generated for exam retention.
          </p>
        </div>

        {onRegenerateDiagrams && (
          <button className="btn btn-outline" onClick={onRegenerateDiagrams} style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}>
            <RefreshCw size={15} />
            <span>Regenerate Diagrams</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {diagrams.map((diag) => {
          const currentZoom = zoomLevel[diag.id] || 1;

          return (
            <div key={diag.id} className="diagram-card">
              <div className="diagram-header">
                <div>
                  <div style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.55rem', borderRadius: '4px', marginBottom: '0.35rem' }}>
                    {diag.category || diag.type}
                  </div>
                  <h4 style={{ fontSize: '1.18rem', fontWeight: 700 }}>{diag.title}</h4>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.6rem' }}
                    onClick={() => handleZoom(diag.id, 0.15)}
                    title="Zoom in"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.6rem' }}
                    onClick={() => handleZoom(diag.id, -0.15)}
                    title="Zoom out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.6rem' }}
                    onClick={() => setFullscreenDiagram(diag)}
                    title="Fullscreen view"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.6rem' }}
                    onClick={() => handleDownloadSVG(diag)}
                    title="Export SVG"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* RENDER CANVAS */}
              <div
                id={`diagram-box-${diag.id}`}
                className="diagram-canvas-box"
                style={{ transform: `scale(${currentZoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
              >
                <MermaidRenderer id={diag.id} syntax={diag.syntax} />
              </div>

              {/* EXPLANATIONS */}
              <div className="diagram-explanations">
                <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    <Info size={16} />
                    <span>Simple Explanation</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {diag.simple_explanation}
                  </p>
                </div>

                <div style={{ background: '#f5f3ff', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #ddd6fe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    <Award size={16} />
                    <span>Exam Scoring Advice</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#5b21b6', lineHeight: 1.55 }}>
                    {diag.exam_explanation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN MODAL */}
      {fullscreenDiagram && (
        <div className="modal-overlay" onClick={() => setFullscreenDiagram(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '95vw', width: '1200px', height: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{fullscreenDiagram.title}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => handleDownloadSVG(fullscreenDiagram)}>
                  <Download size={16} />
                  <span>Download SVG</span>
                </button>
                <button className="btn btn-outline" onClick={() => setFullscreenDiagram(null)}>
                  <Minimize2 size={16} />
                  <span>Close</span>
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', background: '#f8fafc', padding: '2rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MermaidRenderer id={`fs-${fullscreenDiagram.id}`} syntax={fullscreenDiagram.syntax} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
