import React from 'react';
import { BookOpen, Sparkles, FileText, HelpCircle, HardDrive } from 'lucide-react';

export default function Navbar({ backendStatus, onReset, onOpenHelp, activeKit }) {
  const isOnline = backendStatus?.status === 'healthy';
  const hasKey = backendStatus?.openrouter_configured;

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

        <div className="status-indicator" title={hasKey ? `Connected to OpenRouter (${backendStatus.active_model})` : 'Running with Integrated Engine'}>
          <span className={`status-dot ${isOnline ? '' : 'offline'}`} />
          <span>{hasKey ? 'AI Online (OpenRouter)' : 'AI Engine Ready'}</span>
        </div>

        <button className="btn btn-outline" onClick={onOpenHelp} title="User Guide & Tips" style={{ padding: '0.45rem 0.8rem' }}>
          <HelpCircle size={18} />
          <span style={{ fontSize: '0.85rem' }}>Guide</span>
        </button>
      </div>
    </header>
  );
}
