import React from 'react';
import { BookOpen, Clock, Award, CheckCircle2, Download, Printer, FileText, Share2 } from 'lucide-react';

export default function OverviewTab({ kit, docData, onOpenPdf }) {
  const overview = kit?.overview || {};

  const handleExportMarkdown = () => {
    const title = overview.title || 'StudyMate_AI_Notes';
    let md = `# ${title}\n\n`;
    md += `**Subject Area:** ${overview.subject_area || 'Academic Notes'}\n`;
    md += `**Estimated Study Time:** ${overview.estimated_study_time || '45 Mins'}\n\n`;
    md += `## Executive Summary\n${overview.summary || ''}\n\n`;

    if (overview.key_takeaways) {
      md += `## Key Takeaways\n`;
      overview.key_takeaways.forEach((k) => (md += `- ${k}\n`));
      md += `\n`;
    }

    if (kit?.notes?.easy_mode) {
      md += `## Easy Mode Notes\n${kit.notes.easy_mode.simple_explanation}\n\n`;
    }
    if (kit?.notes?.detailed_mode) {
      md += `## Detailed Technical Architecture\n${kit.notes.detailed_mode.detailed_explanation}\n\n`;
    }
    if (kit?.notes?.exam_mode?.short_answer_5_mark) {
      md += `## 5-Mark Question & Answer\n**Q:** ${kit.notes.exam_mode.short_answer_5_mark.question}\n\n${kit.notes.exam_mode.short_answer_5_mark.model_answer}\n\n`;
    }
    if (kit?.notes?.exam_mode?.long_answer_10_mark) {
      md += `## 10-Mark Question & Answer\n**Q:** ${kit.notes.exam_mode.long_answer_10_mark.question}\n\n${kit.notes.exam_mode.long_answer_10_mark.model_answer}\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_StudyKit.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(kit, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${(overview.title || 'StudyKit').replace(/\s+/g, '_')}.json`;
    a.click();
  };

  return (
    <div>
      {/* HEADER HERO IN TAB */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <Award size={14} />
            <span>{overview.subject_area || 'Computer Science & Engineering'}</span>
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{overview.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={16} /> {overview.estimated_study_time || '45 Mins'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BookOpen size={16} /> Difficulty: {overview.difficulty_level || 'Intermediate'}
            </span>
            {docData && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={onOpenPdf}>
                <FileText size={16} /> View Original PDF ({docData.page_count} Pages)
              </span>
            )}
          </div>
        </div>

        {/* EXPORT BUTTONS */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button className="btn btn-outline" onClick={handleExportMarkdown} title="Export as Markdown notes">
            <Download size={16} />
            <span>Export Notes (.md)</span>
          </button>
          <button className="btn btn-outline" onClick={() => window.print()} title="Print Study Kit">
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button className="btn btn-outline" onClick={handleExportJSON} title="Export JSON">
            <Share2 size={16} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* SUMMARY BOX */}
      <div className="note-box" style={{ background: '#f8fafc', borderColor: '#e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} color="var(--primary)" />
          <span>Executive Academic Summary</span>
        </h3>
        <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-muted)' }}>
          {overview.summary}
        </p>
      </div>

      {/* KEY TAKEAWAYS */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} color="var(--success)" />
          <span>Core Learning Outcomes & Syllabus Mastery</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {overview.key_takeaways?.map((takeaway, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem 1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--success-light)', color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                {idx + 1}
              </div>
              <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.5 }}>
                {takeaway}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KIT NAVIGATION STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Interactive Visuals</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4c1d95' }}>{kit?.diagrams?.length || 3} Diagrams</div>
          <div style={{ fontSize: '0.8rem', color: '#7c3aed' }}>Flowcharts, Mind Maps & Blocks</div>
        </div>

        <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a16207', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Revision Cards</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#854d0e' }}>{kit?.sticky_notes?.length || 8} Sticky Notes</div>
          <div style={{ fontSize: '0.8rem', color: '#b45309' }}>Formulas, Definitions & Traps</div>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Self-Testing Engine</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065f46' }}>{kit?.quiz?.length || 5} Questions</div>
          <div style={{ fontSize: '0.8rem', color: '#059669' }}>MCQs, True/False & Fill Blanks</div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Exam Templates</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e40af' }}>5 & 10 Marks</div>
          <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>High-scoring structured answers</div>
        </div>
      </div>
    </div>
  );
}
