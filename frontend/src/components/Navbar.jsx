import React from 'react';
import { BookOpen, Sparkles, HelpCircle, Cpu, Settings } from 'lucide-react';

export default function Navbar({ backendStatus, onReset, onOpenHelp, onOpenSettings, activeKit }) {
  const isAIConnected = backendStatus?.is_ai_connected;
  const providerLabel = backendStatus?.provider_label || (isAIConnected ? 'AI Connected' : 'Smart Document Analyzer');

  return (
    <header className="navbar">
      <div className="brand-wrapper" onClick={onReset} title="StudyMate AI Home">
        <div className="brand-logo-icon">
          <BookOpen size={22} strokeWidth={2.5} />
        </div>
        <div className="brand-title">
          <span>StudyMate</span>
          <span style={{ color: 'var(--primary)' }}>AI</span>
          <span className="brand-badge">PRO ED</span>
        </div>
      </div>

      <div className="nav-actions">
        {activeKit && (
          <button className="btn btn-outline" onClick={onReset} style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}>
            <Sparkles size={16} />
            <span>New Study Kit</span>
          </button>
        )}

        {/* INTERACTIVE AI ENGINE BADGE */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="btn btn-outline"
          title="Click to configure AI providers or view analysis engine"
          style={{
            fontSize: '0.82rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '999px',
            border: isAIConnected ? '1px solid #a7f3d0' : '1px solid var(--border)',
            background: isAIConnected ? '#ecfdf5' : '#ffffff',
            color: isAIConnected ? '#065f46' : 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <span className={`status-dot ${isAIConnected ? '' : 'offline'}`} style={{ width: '8px', height: '8px' }} />
          <span>{providerLabel}</span>
          <Settings size={14} style={{ opacity: 0.7 }} />
        </button>

        <button className="btn btn-outline" onClick={onOpenHelp} title="User Guide & Tips" style={{ padding: '0.45rem 0.8rem' }}>
          <HelpCircle size={18} />
          <span style={{ fontSize: '0.85rem' }}>Guide</span>
        </button>
      </div>
    </header>
  );
}
