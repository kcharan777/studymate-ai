import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, RotateCcw, Sparkles, HelpCircle, ArrowRight, Award, Plus, FileText } from 'lucide-react';
import { generateMoreQuiz } from '../services/api';

export default function QuizTab({ kit, onOpenPdf }) {
  const initialQuestions = kit?.quiz || [];
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (kit?.quiz) {
      setQuestions(kit.quiz);
      resetQuiz();
    }
  }, [kit]);

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setIsCompleted(false);
  };

  const filteredQuestions = questions.filter((q) => {
    if (difficultyFilter === 'all') return true;
    return q.difficulty === difficultyFilter;
  });

  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0];
  const totalQ = filteredQuestions.length;

  const handleSelectOption = (opt) => {
    if (submittedAnswers[currentQ?.id] && !isPracticeMode) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ?.id]: opt,
    }));

    if (isPracticeMode) {
      setSubmittedAnswers((prev) => ({
        ...prev,
        [currentQ?.id]: true,
      }));
    }
  };

  const handleSubmitCurrent = () => {
    if (!selectedAnswers[currentQ?.id]) return;

    setSubmittedAnswers((prev) => ({
      ...prev,
      [currentQ?.id]: true,
    }));

    if (currentIndex < totalQ - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsCompleted(true);
    // Calculate score
    let correctCount = 0;
    filteredQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    if (correctCount / totalQ >= 0.7) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleLoadMoreQuestions = async () => {
    setIsLoadingMore(true);
    try {
      const extra = await generateMoreQuiz({
        topic: kit?.topic || kit?.overview?.title || 'Academic Notes',
        difficulty: difficultyFilter === 'all' ? 'medium' : difficultyFilter,
        count: 4,
      });
      setQuestions((prev) => [...prev, ...extra]);
    } catch (err) {
      console.error('Error generating extra quiz questions:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Score stats
  let totalScore = 0;
  filteredQuestions.forEach((q) => {
    if (selectedAnswers[q.id] === q.correct_answer) {
      totalScore++;
    }
  });

  if (!currentQ && !isCompleted) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>No questions found matching difficulty '{difficultyFilter}'.</p>
        <button className="btn btn-outline" onClick={() => setDifficultyFilter('all')} style={{ marginTop: '1rem' }}>
          Reset Filter
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Interactive Knowledge Assessment</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Exam-grounded questions with real-time feedback, marking, and conceptual explanations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* PRACTICE MODE TOGGLE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', background: 'var(--bg-subtle)', padding: '0.35rem 0.75rem', borderRadius: '999px', border: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 600 }}>Practice Mode:</span>
            <button
              onClick={() => setIsPracticeMode(!isPracticeMode)}
              style={{
                width: 38,
                height: 20,
                borderRadius: 999,
                background: isPracticeMode ? 'var(--primary)' : '#cbd5e1',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: 3,
                  left: isPracticeMode ? 20 : 4,
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>

          {/* DIFFICULTY FILTER */}
          <div className="pill-group">
            {['all', 'easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                className={`pill-option ${difficultyFilter === d ? 'active' : ''}`}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                onClick={() => { setDifficultyFilter(d); resetQuiz(); }}
              >
                {d.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
            onClick={handleLoadMoreQuestions}
            disabled={isLoadingMore}
          >
            <Plus size={15} />
            <span>{isLoadingMore ? 'Generating...' : 'Add More Qs'}</span>
          </button>
        </div>
      </div>

      {/* RESULT CARD IF COMPLETED */}
      {isCompleted ? (
        <div className="quiz-card" style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: totalScore / totalQ >= 0.7 ? 'var(--success-light)' : 'var(--warning-light)', color: totalScore / totalQ >= 0.7 ? '#047857' : '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <Award size={36} />
          </div>

          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Quiz Completed!
          </h3>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You scored <strong>{totalScore}</strong> out of <strong>{totalQ}</strong> ({Math.round((totalScore / totalQ) * 100)}%)
          </p>

          {/* DETAILED QUESTION REVIEW */}
          <div style={{ textAlign: 'left', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Answer Review & Explanations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredQuestions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correct_answer;

                return (
                  <div
                    key={q.id}
                    style={{
                      background: isCorrect ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1.1rem 1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        Q{idx + 1}: {q.question}
                      </div>
                      {isCorrect ? (
                        <CheckCircle2 size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                      ) : (
                        <XCircle size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <strong>Your Answer:</strong> <span style={{ color: isCorrect ? '#15803d' : '#b91c1c' }}>{userAns || 'Not Answered'}</span>
                    </div>
                    {!isCorrect && (
                      <div style={{ fontSize: '0.85rem', color: '#15803d', marginBottom: '0.35rem' }}>
                        <strong>Correct Answer:</strong> {q.correct_answer}
                      </div>
                    )}
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.5rem', background: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={resetQuiz} style={{ padding: '0.65rem 1.5rem' }}>
              <RotateCcw size={16} />
              <span>Retry Quiz</span>
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE QUESTION CARD */
        <div className="quiz-card">
          {/* PROGRESS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>Question {currentIndex + 1} of {totalQ}</span>
            <span style={{ textTransform: 'uppercase', background: 'var(--bg-subtle)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
              {currentQ.difficulty || 'medium'}
            </span>
          </div>

          <div className="quiz-progress-bar">
            <div style={{ height: '100%', width: `${((currentIndex + 1) / totalQ) * 100}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
          </div>

          {/* QUESTION TEXT */}
          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '1.5rem 0 1.5rem 0', lineHeight: 1.4 }}>
            {currentQ.question}
          </h4>

          {/* OPTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentQ.options?.map((opt, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === opt;
              const isSubmitted = submittedAnswers[currentQ.id];
              const isCorrectOpt = opt === currentQ.correct_answer;

              let btnClass = 'quiz-option-btn';
              if (isPracticeMode || isSubmitted) {
                if (isCorrectOpt) btnClass += ' correct';
                else if (isSelected) btnClass += ' incorrect';
              } else if (isSelected) {
                btnClass += ' selected';
              }

              return (
                <button
                  key={idx}
                  className={btnClass}
                  onClick={() => handleSelectOption(opt)}
                >
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: isSelected ? 'var(--primary)' : '#f1f5f9', color: isSelected ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {(isPracticeMode || isSubmitted) && isCorrectOpt && (
                    <CheckCircle2 size={18} color="var(--success)" />
                  )}
                  {(isPracticeMode || isSubmitted) && isSelected && !isCorrectOpt && (
                    <XCircle size={18} color="var(--danger)" />
                  )}
                </button>
              );
            })}
          </div>

          {/* EXPLANATION IN PRACTICE MODE */}
          {(isPracticeMode || submittedAnswers[currentQ.id]) && (
            <div style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                💡 Conceptual Explanation & Source
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                {currentQ.explanation}
              </p>
              {currentQ.source_ref && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                  Source: {currentQ.source_ref}
                </div>
              )}
            </div>
          )}

          {/* NEXT / SUBMIT BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </button>

            <button
              className="btn btn-primary"
              onClick={handleSubmitCurrent}
              disabled={!selectedAnswers[currentQ.id]}
            >
              <span>{currentIndex === totalQ - 1 ? 'Finish & View Score' : 'Next Question'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
