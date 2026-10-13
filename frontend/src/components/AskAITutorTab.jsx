import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { askAITutor } from '../services/api';

const QUICK_PROMPTS = [
  'Explain the core concept in simple words with an analogy',
  'Give me a high-scoring 10-mark answer for this unit',
  'What are the most common exam traps or mistakes students make?',
  'Compare the two most important concepts in a structured table',
  'What are likely oral viva questions a professor might ask?',
];

export default function AskAITutorTab({ docData, topic, onOpenPdf }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your StudyMate AI Tutor. I have analyzed your ${docData ? `uploaded notes ('${docData.filename}')` : `study topic ('${topic}')`}. Ask me any question, request page explanations, or ask for custom exam answers grounded in your material!`,
      page_references: docData ? [1] : [],
      is_grounded_in_pdf: !!docData,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || isLoading) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const response = await askAITutor({
        question: textToSend,
        docId: docData?.doc_id,
        topic,
        history,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          page_references: response.page_references || [],
          is_grounded_in_pdf: response.is_grounded_in_pdf,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your query. Please verify your connection or try rephrasing.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Ask AI Document Tutor</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {docData ? `Answers strictly grounded in '${docData.filename}' with page citations.` : `Syllabus-aligned tutor answering queries on '${topic}'.`}
        </p>
      </div>

      {/* QUICK SUGGESTIONS */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            className="quick-topic-tag"
            style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}
            onClick={() => handleSend(p)}
          >
            ⚡ {p}
          </button>
        ))}
      </div>

      {/* CHAT WINDOW */}
      <div className="chat-window">
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${m.role}`}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, opacity: 0.85 }}>
                {m.role === 'assistant' ? (
                  <>
                    <Bot size={14} />
                    <span>StudyMate Tutor</span>
                  </>
                ) : (
                  <>
                    <User size={14} />
                    <span>You</span>
                  </>
                )}
              </div>

              <div style={{ whiteSpace: 'pre-line' }}>
                {m.content}
              </div>

              {/* PAGE REFERENCES BADGES */}
              {m.page_references && m.page_references.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                  <FileText size={13} color="var(--primary)" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>Referenced Notes:</span>
                  {m.page_references.map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => onOpenPdf && onOpenPdf(pNum)}
                      style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Jump to this page in PDF reader"
                    >
                      Page {pNum}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble assistant" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              Consulting your syllabus material and formulating explanation...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM */}
        <form
          className="chat-input-row"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <input
            type="text"
            className="form-input"
            placeholder={docData ? "Ask about page 2, formulas, or 10-mark answers..." : "Ask questions about this academic topic..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!input.trim() || isLoading}
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
