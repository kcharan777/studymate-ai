import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, CheckCircle2, X, ArrowRight, BookOpen, Layers, Cpu, Award } from 'lucide-react';
import { uploadPDF, generateStudyKit } from '../services/api';

const QUICK_TOPICS = [
  'Photosynthesis & Calvin Cycle (Biology)',
  'Newton\'s Laws of Motion (Physics)',
  'World War I & Versailles Treaty (History)',
  'Database Normalization (DBMS)',
  'Macroeconomics & Inflation Control',
  'Data Structures: Binary Trees & Graphs',
];

export default function HeroGenerator({ onKitGenerated, savedKits = [], onLoadSavedKit }) {
  const [file, setFile] = useState(null);
  const [docData, setDocData] = useState(null);
  const [topic, setTopic] = useState('');
  const [focusUnit, setFocusUnit] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF file (.pdf)');
      return;
    }
    setErrorMsg('');
    setFile(selectedFile);
    setIsLoading(true);
    setProgressText('Uploading and reading PDF pages...');
    setProgressStep(15);

    try {
      const data = await uploadPDF(selectedFile);
      setDocData(data);
      setProgressText(`Extracted ${data.page_count} pages successfully!`);
      setProgressStep(30);
      if (!topic && data.filename) {
        setTopic(data.filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error parsing PDF document');
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!docData && !topic.trim()) {
      setErrorMsg('Please upload a PDF or enter a Topic Name to generate your study kit.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    const steps = [
      { step: 25, text: 'Analyzing document structure & extracting concepts...' },
      { step: 50, text: 'Structuring Easy, Detailed & Exam Mode notes...' },
      { step: 75, text: 'Synthesizing Mermaid diagrams & visual concept maps...' },
      { step: 90, text: 'Generating colorful pastel sticky revision cards & quizzes...' },
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setProgressStep(steps[currentStepIdx].step);
        setProgressText(steps[currentStepIdx].text);
        currentStepIdx++;
      }
    }, 900);

    try {
      const kit = await generateStudyKit({
        docId: docData?.doc_id,
        topic: topic.trim(),
        focusUnit: focusUnit.trim(),
      });
      clearInterval(interval);
      setProgressStep(100);
      setProgressText('Study kit generated successfully!');
      setTimeout(() => {
        onKitGenerated(kit, docData);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate study kit. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="hero-section">
      <div className="hero-tag">
        <Sparkles size={16} />
        <span>Personalized Academic Learning Accelerator</span>
      </div>

      <h1 className="hero-title">
        Turn Any Academic PDF Into <br />
        <span className="gradient-text">Complete Exam-Ready Study Kits</span>
      </h1>

      <p className="hero-subtitle">
        Upload classroom notes, syllabus PDFs, or enter any college topic. StudyMate AI generates 
        multi-mode notes, interactive diagrams, digital sticky cards, mock tests, and a document-grounded AI tutor.
      </p>

      <div className="generator-card">
        {errorMsg && (
          <div style={{
            background: 'var(--danger-light)',
            color: '#b91c1c',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} style={{ color: '#b91c1c' }}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="generator-grid">
          {/* LEFT: DROPZONE */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.65rem' }}>
              <FileText size={18} color="var(--primary)" />
              <span>Step 1: Upload College Notes / PDF</span>
            </label>

            {!file ? (
              <div
                className={`dropzone ${isDragging ? 'active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                />
                <div className="dropzone-icon-circle">
                  <UploadCloud size={30} />
                </div>
                <div className="dropzone-title">Click or drag & drop your PDF here</div>
                <div className="dropzone-desc">Classroom notes, syllabus units, textbooks, or assignment sheets</div>
                <button type="button" className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}>
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="file-pill">
                <FileText size={32} className="file-pill-icon" />
                <div className="file-pill-info">
                  <div className="file-pill-name">{file.name}</div>
                  <div className="file-pill-meta">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {docData?.page_count || '...'} Pages
                    {docData?.is_scanned_likely && ' • Scanned PDF detected'}
                  </div>
                </div>
                <button
                  type="button"
                  className="file-remove-btn"
                  onClick={() => { setFile(null); setDocData(null); }}
                  title="Remove file"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: TOPIC INPUT & OPTIONS */}
          <div className="inputs-column">
            <div className="form-group">
              <label className="form-label">
                <BookOpen size={18} color="var(--accent-purple)" />
                <span>Step 2: Enter Topic or Unit Name</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Photosynthesis, Newton's Laws, World History, Data Structures..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />

              <div className="quick-topics">
                {QUICK_TOPICS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="quick-topic-tag"
                    onClick={() => setTopic(item)}
                  >
                    + {item.split(' ')[0]} {item.split(' ')[1] || ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <Layers size={16} />
                <span>Focus Specific Unit / Chapter (Optional)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Unit 2: Functional Dependencies"
                value={focusUnit}
                onChange={(e) => setFocusUnit(e.target.value)}
                style={{ fontSize: '0.88rem', padding: '0.6rem 0.85rem' }}
              />
            </div>
          </div>
        </div>

        {/* LOADING PROGRESS BAR */}
        {isLoading && (
          <div className="progress-container">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressStep}%` }} />
            </div>
            <div className="progress-steps">
              <span>{progressText}</span>
              <span>{progressStep}%</span>
            </div>
          </div>
        )}

        {/* FOOTER & BUTTON */}
        <div className="generator-footer">
          <div className="mode-badge">
            <CheckCircle2 size={16} color="var(--success)" />
            <span>
              {docData ? 'PDF Grounded Analysis' : topic ? 'Topic-Only Learning Mode' : 'Upload PDF or Enter Topic'}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={isLoading || (!docData && !topic.trim())}
            onClick={handleGenerate}
            style={{ padding: '0.85rem 1.85rem', fontSize: '1rem' }}
          >
            <Sparkles size={18} />
            <span>{isLoading ? 'Generating Study Kit...' : 'Generate My Study Kit'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* RECENT SAVED KITS BAR */}
      {savedKits && savedKits.length > 0 && (
        <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>
            <Award size={16} />
            <span>Recently Generated Study Kits ({savedKits.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {savedKits.slice(0, 4).map((k, idx) => (
              <div
                key={idx}
                onClick={() => onLoadSavedKit(k)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {k.overview?.title || k.topic || 'Academic Kit'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {k.diagrams?.length || 0} Diagrams • {k.sticky_notes?.length || 0} Sticky Notes • {k.quiz?.length || 0} Quizzes
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
