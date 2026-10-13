import React, { useState } from 'react';
import { X, FileText, ChevronLeft, ChevronRight, Eye, AlignLeft } from 'lucide-react';
import { getPDFUrl } from '../services/api';

export default function PDFViewerModal({ docData, initialPage = 1, onClose }) {
  const [activeTab, setActiveTab] = useState('embed'); // 'embed' or 'extracted'
  const [currentPage, setCurrentPage] = useState(initialPage);

  if (!docData) return null;

  const pdfUrl = getPDFUrl(docData.doc_id);
  const pages = docData.preview_pages || [];
  const activePageData = pages.find((p) => p.page_num === currentPage) || pages[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1100px', width: '95vw', height: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={22} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{docData.filename}</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {docData.page_count} Pages • Total {docData.total_chars?.toLocaleString()} Characters
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="pill-group">
              <button
                className={`pill-option ${activeTab === 'embed' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                onClick={() => setActiveTab('embed')}
              >
                <Eye size={14} style={{ display: 'inline', marginRight: '4px' }} />
                PDF Preview
              </button>
              <button
                className={`pill-option ${activeTab === 'extracted' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                onClick={() => setActiveTab('extracted')}
              >
                <AlignLeft size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Extracted Text
              </button>
            </div>

            <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          {activeTab === 'embed' ? (
            <iframe
              src={`${pdfUrl}#page=${currentPage}`}
              title="PDF Document Preview"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* PAGE NAV BAR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', background: '#ffffff', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Page {currentPage} of {docData.page_count}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.6rem' }}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0.6rem' }}
                    onClick={() => setCurrentPage((p) => Math.min(docData.page_count, p + 1))}
                    disabled={currentPage >= docData.page_count}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* EXTRACTED TEXT */}
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#ffffff', fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {activePageData?.preview_text || 'No text extracted for this page.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
