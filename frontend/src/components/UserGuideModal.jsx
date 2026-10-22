import React from 'react';
import { X, BookOpen, Key, CheckCircle, Sparkles, Layers, Award } from 'lucide-react';

export default function UserGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>StudyMate AI — Student User Guide</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.35rem' }}>
              1. Two Flexible Learning Modes
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              • <strong>With PDF:</strong> Upload any lecture note, syllabus unit, or assignment document. All explanations, quizzes, and diagrams are directly extracted and cited with page references.<br />
              • <strong>Topic-Only Mode:</strong> Type any topic (e.g. <em>Photosynthesis, Newton's Laws, or Database Normalization</em>) without a PDF to generate a full curriculum study kit.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '0.35rem' }}>
              2. Three Targeted Note Styles
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              • <strong>Easy Mode:</strong> Casual language and everyday analogies for quick understanding.<br />
              • <strong>Detailed Mode:</strong> Full architectural breakdowns, advantages, and real-world applications.<br />
              • <strong>Exam Mode:</strong> Structured 5-mark and 10-mark blueprints matching university exam grading criteria.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#047857', marginBottom: '0.35rem' }}>
              3. Interactive Diagram & Revision Tools
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              • Zoom and download Mermaid.js flowcharts and mind maps as clean SVGs.<br />
              • Pin, color-code, and edit pastel sticky revision cards. All edits are saved automatically in your browser.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.35rem' }}>
              <Key size={16} />
              <span>Configuring Your Real OpenRouter API Key</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              To enable live cloud LLM processing, create a file named <code>.env</code> in the <code>backend/</code> folder with:
            </p>
            <pre style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border)', marginTop: '0.4rem', overflowX: 'auto' }}>
{`OPENROUTER_API_KEY=your_key_from_openrouter_ai
OPENROUTER_MODEL=google/gemini-2.5-flash`}
            </pre>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '0.4rem' }}>
              StudyMate AI includes an integrated curriculum fallback engine, allowing full offline testing even before an API key is supplied!
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Got it, Let's Learn!
          </button>
        </div>
      </div>
    </div>
  );
}
