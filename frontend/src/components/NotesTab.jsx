import React, { useState } from 'react';
import { BookOpen, Sparkles, Award, Volume2, VolumeX, Copy, Check, FileCheck, Layers, HelpCircle, ArrowRight } from 'lucide-react';

export default function NotesTab({ kit, onOpenPdf }) {
  const [activeMode, setActiveMode] = useState('exam'); // 'easy', 'detailed', 'exam'
  const [examLength, setExamLength] = useState('5mark'); // '5mark', '10mark', 'summary'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const notes = kit?.notes || {};
  const easyMode = notes.easy_mode || {};
  const detailedMode = notes.detailed_mode || {};
  const examMode = notes.exam_mode || {};

  const handleSpeak = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported on this browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* CONTROLS HEADER */}
      <div className="notes-header-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)' }}>Explanation Style:</span>
          <div className="pill-group">
            <button
              className={`pill-option ${activeMode === 'easy' ? 'active' : ''}`}
              onClick={() => setActiveMode('easy')}
            >
              🌱 Easy Mode
            </button>
            <button
              className={`pill-option ${activeMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setActiveMode('detailed')}
            >
              🔍 Detailed Mode
            </button>
            <button
              className={`pill-option ${activeMode === 'exam' ? 'active' : ''}`}
              onClick={() => setActiveMode('exam')}
            >
              🎯 Exam Mode (5 & 10 Marks)
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            className="btn btn-outline"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            onClick={() => {
              const fullText = activeMode === 'easy'
                ? `${easyMode.title}\n${easyMode.definition}\n${easyMode.simple_explanation}`
                : activeMode === 'detailed'
                ? `${detailedMode.title}\n${detailedMode.definition}\n${detailedMode.detailed_explanation}`
                : `${examMode.short_answer_5_mark?.model_answer}\n${examMode.long_answer_10_mark?.model_answer}`;
              handleSpeak(fullText);
            }}
          >
            {isSpeaking ? <VolumeX size={16} color="var(--danger)" /> : <Volume2 size={16} />}
            <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
          </button>

          <button
            className="btn btn-outline"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            onClick={() => {
              const textToCopy = activeMode === 'easy'
                ? easyMode.simple_explanation
                : activeMode === 'detailed'
                ? detailedMode.detailed_explanation
                : examMode.short_answer_5_mark?.model_answer;
              handleCopy(textToCopy);
            }}
          >
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* EASY MODE PANEL */}
      {activeMode === 'easy' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div className="note-box" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="note-box-title">
              <Sparkles size={20} color="#10b981" />
              <span>{easyMode.title || 'Easy Mode: Beginner-Friendly Overview'}</span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Simple Definition
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'var(--text-main)', fontWeight: 500 }}>
                {easyMode.definition}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Intuitive Explanation
              </div>
              <p style={{ fontSize: '0.98rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
                {easyMode.simple_explanation}
              </p>
            </div>

            {easyMode.real_world_analogy && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  💡 Everyday Analogy
                </div>
                <p style={{ fontSize: '0.95rem', color: '#78350f', lineHeight: 1.6 }}>
                  {easyMode.real_world_analogy}
                </p>
              </div>
            )}

            {easyMode.key_highlights && (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.65rem' }}>
                  What You Need to Remember:
                </div>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {easyMode.key_highlights.map((h, i) => (
                    <li key={i} style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAILED MODE PANEL */}
      {activeMode === 'detailed' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div className="note-box" style={{ borderLeft: '4px solid var(--secondary)' }}>
            <div className="note-box-title">
              <Layers size={20} color="var(--secondary)" />
              <span>{detailedMode.title || 'In-Depth Technical Architecture'}</span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Formal Technical Definition
              </div>
              <p style={{ fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--text-main)', fontWeight: 500 }}>
                {detailedMode.definition}
              </p>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                How It Works & Mechanism
              </div>
              <p style={{ fontSize: '0.96rem', lineHeight: 1.75, color: 'var(--text-muted)' }}>
                {detailedMode.detailed_explanation}
              </p>
            </div>

            {detailedMode.components_breakdown && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Architectural Components & Phases
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                  {detailedMode.components_breakdown.map((c, i) => (
                    <div key={i} style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROS & CONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>✓ Advantages & Benefits</div>
                <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {detailedMode.advantages?.map((adv, i) => (
                    <li key={i} style={{ fontSize: '0.86rem', color: '#14532d' }}>{adv}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>⚠ Trade-offs & Limitations</div>
                <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {detailedMode.disadvantages?.map((dis, i) => (
                    <li key={i} style={{ fontSize: '0.86rem', color: '#7f1d1d' }}>{dis}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* APPLICATIONS */}
            {detailedMode.applications && (
              <div style={{ background: '#f1f5f9', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>🚀 Real-World Applications:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {detailedMode.applications.map((app, i) => (
                    <span key={i} style={{ background: '#ffffff', border: '1px solid var(--border)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXAM MODE PANEL */}
      {activeMode === 'exam' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          {/* LENGTH SWITCHER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: '#eef2ff', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>Exam Marking Template:</span>
            <button
              className={`pill-option ${examLength === '5mark' ? 'active' : ''}`}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
              onClick={() => setExamLength('5mark')}
            >
              5-Mark Structure
            </button>
            <button
              className={`pill-option ${examLength === '10mark' ? 'active' : ''}`}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
              onClick={() => setExamLength('10mark')}
            >
              10-Mark Comprehensive
            </button>
            <button
              className={`pill-option ${examLength === 'summary' ? 'active' : ''}`}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
              onClick={() => setExamLength('summary')}
            >
              Quick Revision Summary
            </button>
          </div>

          {examLength === '5mark' && examMode.short_answer_5_mark && (
            <div className="note-box" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {examMode.short_answer_5_mark.question}
                </div>
                <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                  Weightage: 5 Marks
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed #cbd5e1', marginBottom: '1.25rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                <strong>Examiner Marking Scheme:</strong> {examMode.short_answer_5_mark.structure}
              </div>

              <div style={{ whiteSpace: 'pre-line', fontSize: '0.98rem', lineHeight: 1.7, color: 'var(--text-main)', background: '#ffffff', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                {examMode.short_answer_5_mark.model_answer}
              </div>
            </div>
          )}

          {examLength === '10mark' && examMode.long_answer_10_mark && (
            <div className="note-box" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {examMode.long_answer_10_mark.question}
                </div>
                <span style={{ background: 'var(--accent-purple-light)', color: 'var(--accent-purple)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                  Weightage: 10 Marks
                </span>
              </div>

              <div style={{ background: '#f5f3ff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed #c4b5fd', marginBottom: '1.25rem', fontSize: '0.84rem', color: '#5b21b6' }}>
                <strong>Scoring Blueprint:</strong> {examMode.long_answer_10_mark.structure}
              </div>

              <div style={{ whiteSpace: 'pre-line', fontSize: '0.98rem', lineHeight: 1.75, color: 'var(--text-main)', background: '#ffffff', padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                {examMode.long_answer_10_mark.model_answer}
              </div>
            </div>
          )}

          {examLength === 'summary' && (
            <div className="note-box" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div className="note-box-title" style={{ color: '#b45309' }}>
                <Award size={20} color="#b45309" />
                <span>Last-Minute Revision Bullet Points</span>
              </div>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {examMode.revision_summary_bullet_points?.map((pt, i) => (
                  <li key={i} style={{ fontSize: '0.96rem', color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.6 }}>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* COMPARISON TABLE */}
          {examMode.comparison_table && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                📊 {examMode.comparison_table.title}
              </h4>
              <div className="comparison-table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      {examMode.comparison_table.headers.map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {examMode.comparison_table.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={cIdx === 0 ? { fontWeight: 600, color: 'var(--text-main)' } : {}}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
