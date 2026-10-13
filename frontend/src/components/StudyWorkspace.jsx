import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Layers,
  StickyNote,
  HelpCircle,
  Award,
  MessageSquare,
  Eye,
  RefreshCw,
  ArrowLeft,
  Share2,
} from 'lucide-react';

import OverviewTab from './OverviewTab';
import NotesTab from './NotesTab';
import DiagramsTab from './DiagramsTab';
import StickyNotesTab from './StickyNotesTab';
import QuizTab from './QuizTab';
import ExamPrepTab from './ExamPrepTab';
import AskAITutorTab from './AskAITutorTab';
import PDFViewerModal from './PDFViewerModal';
import { regenerateSection } from '../services/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'notes', label: 'Detailed Notes', icon: FileText },
  { id: 'diagrams', label: 'Diagrams', icon: Layers },
  { id: 'stickies', label: 'Sticky Notes', icon: StickyNote },
  { id: 'quiz', label: 'Quizzes', icon: HelpCircle },
  { id: 'examprep', label: 'Exam Preparation', icon: Award },
  { id: 'askai', label: 'Ask AI Tutor', icon: MessageSquare },
];

export default function StudyWorkspace({ kit, docData, onBackToHero, onUpdateKit }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfJumpPage, setPdfJumpPage] = useState(1);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleOpenPdf = (pageNum = 1) => {
    setPdfJumpPage(pageNum);
    setShowPdfModal(true);
  };

  const handleUpdateStickyNotes = (updatedStickies) => {
    const updatedKit = { ...kit, sticky_notes: updatedStickies };
    onUpdateKit(updatedKit);
  };

  const handleRegenerateDiagrams = async () => {
    setIsRegenerating(true);
    try {
      const res = await regenerateSection({
        section: 'diagrams',
        topic: kit?.topic || kit?.overview?.title || 'Academic Notes',
      });
      if (res.data) {
        onUpdateKit({ ...kit, diagrams: res.data });
      }
    } catch (err) {
      console.error('Failed to regenerate diagrams:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="workspace-wrapper">
      {/* TOP BAR */}
      <div className="workspace-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-outline"
            onClick={onBackToHero}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="workspace-title-box">
            <h2>{kit?.overview?.title || kit?.topic || 'Study Kit'}</h2>
            <div className="workspace-meta">
              <span>{kit?.overview?.subject_area || 'Academic Study Kit'}</span>
              <span>•</span>
              <span>{kit?.notes?.exam_mode ? 'Exam-Ready' : 'Structured'}</span>
              {docData && (
                <>
                  <span>•</span>
                  <span>Grounded in {docData.filename}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="workspace-actions">
          {docData && (
            <button
              className="btn btn-outline"
              onClick={() => handleOpenPdf(1)}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
            >
              <Eye size={16} />
              <span>Preview PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className="tabs-navigation">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="tab-panel">
        {activeTab === 'overview' && (
          <OverviewTab kit={kit} docData={docData} onOpenPdf={handleOpenPdf} />
        )}

        {activeTab === 'notes' && (
          <NotesTab kit={kit} onOpenPdf={handleOpenPdf} />
        )}

        {activeTab === 'diagrams' && (
          <DiagramsTab
            kit={kit}
            onRegenerateDiagrams={handleRegenerateDiagrams}
          />
        )}

        {activeTab === 'stickies' && (
          <StickyNotesTab
            initialNotes={kit?.sticky_notes}
            onUpdateNotes={handleUpdateStickyNotes}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizTab kit={kit} onOpenPdf={handleOpenPdf} />
        )}

        {activeTab === 'examprep' && (
          <ExamPrepTab kit={kit} />
        )}

        {activeTab === 'askai' && (
          <AskAITutorTab
            docData={docData}
            topic={kit?.topic || kit?.overview?.title}
            onOpenPdf={handleOpenPdf}
          />
        )}
      </div>

      {/* PDF VIEWER MODAL */}
      {showPdfModal && docData && (
        <PDFViewerModal
          docData={docData}
          initialPage={pdfJumpPage}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
}
