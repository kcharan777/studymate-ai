import React, { useState } from 'react';
import { Award, CheckCircle, HelpCircle, ChevronDown, ChevronUp, FileText, Sparkles, BookOpen } from 'lucide-react';

export default function ExamPrepTab({ kit }) {
  const examMode = kit?.notes?.exam_mode || {};
  const possibleQuestions = examMode.possible_exam_questions || [];
  const [openQuestionIdx, setOpenQuestionIdx] = useState(null);

  const toggleQuestion = (idx) => {
    setOpenQuestionIdx(openQuestionIdx === idx ? null : idx);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>University Examination Preparation Kit</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          High-probability exam questions, marking schemes, model answer blueprints, and oral viva tips.
        </p>
      </div>

      {/* 5-MARK AND 10-MARK MODEL ANSWER CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* 5 MARK TEMPLATE */}
        <div className="note-box" style={{ borderTop: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                Standard 5-Mark Problem
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Time: 7 Mins</span>
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {examMode.short_answer_5_mark?.question || 'Core 5-Mark Question'}
            </h4>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '6px', marginBottom: '1rem', border: '1px dashed #cbd5e1' }}>
              <strong>Recommended Format:</strong> {examMode.short_answer_5_mark?.structure}
            </div>
            <div style={{ whiteSpace: 'pre-line', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
              {examMode.short_answer_5_mark?.model_answer}
            </div>
          </div>
        </div>

        {/* 10 MARK TEMPLATE */}
        <div className="note-box" style={{ borderTop: '4px solid var(--accent-purple)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-purple)', background: 'var(--accent-purple-light)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                Comprehensive 10-Mark Problem
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Time: 15 Mins</span>
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {examMode.long_answer_10_mark?.question || 'Core 10-Mark Question'}
            </h4>
            <div style={{ fontSize: '0.84rem', color: '#5b21b6', background: '#f5f3ff', padding: '0.65rem 0.85rem', borderRadius: '6px', marginBottom: '1rem', border: '1px dashed #c4b5fd' }}>
              <strong>Scoring Strategy:</strong> {examMode.long_answer_10_mark?.structure}
            </div>
            <div style={{ whiteSpace: 'pre-line', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-main)', maxHeight: '350px', overflowY: 'auto' }}>
              {examMode.long_answer_10_mark?.model_answer}
            </div>
          </div>
        </div>
      </div>

      {/* FREQUENT EXAM PRACTICE QUESTIONS ACCORDION */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} color="var(--primary)" />
          <span>High-Frequency Predicted Examination Questions</span>
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {possibleQuestions.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                onClick={() => toggleQuestion(idx)}
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: openQuestionIdx === idx ? '#f8fafc' : '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--bg-subtle)', color: 'var(--text-muted)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                    {item.type}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {item.q}
                  </span>
                </div>
                {openQuestionIdx === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {openQuestionIdx === idx && (
                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', background: '#f8fafc', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <p><strong>Guidance to Score Maximum Marks:</strong></p>
                  <p style={{ marginTop: '0.25rem' }}>
                    Start with a clear, concise definition. Highlight keywords in bold or underline. If asking to compare, draw a two-column comparison table. Conclude with a real-world application.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* EXAM DAY CHECKLIST */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} color="#166534" />
          <span>Hall-Ticket Master Checklist (30 Minutes Before Exam)</span>
        </h4>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.92rem', color: '#14532d' }}>
          <li>Always write the formal definition verbatim in the opening paragraph.</li>
          <li>Draw neat labeled block diagrams or flowcharts using a pencil for any question of 5 marks and above.</li>
          <li>Structure long answers with clear headings, comparison tables, and concise summary bullet points.</li>
          <li>Manage time: allocate 1.5 minutes per mark (e.g. 7.5 mins for 5-mark, 15 mins for 10-mark).</li>
        </ul>
      </div>
    </div>
  );
}
