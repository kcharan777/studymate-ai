/**
 * StudyMate AI API Client
 * Connects React frontend with the Flask backend API.
 */

const API_BASE = ''; // Proxied via Vite config to http://localhost:5000

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend health check error:', err);
    return {
      status: 'offline',
      openrouter_configured: false,
      active_model: 'offline-mode',
    };
  }
}

export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload and parse PDF');
  }
  return data;
}

export async function generateStudyKit({ docId, topic, focusUnit, explanationMode = 'all' }) {
  const res = await fetch(`${API_BASE}/api/study-kit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      doc_id: docId,
      topic,
      focus_unit: focusUnit,
      explanation_mode: explanationMode,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate study kit');
  }
  return data.study_kit;
}

export async function askAITutor({ question, docId, topic, history = [] }) {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      doc_id: docId,
      topic,
      history,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to get answer from AI tutor');
  }
  return data;
}

export async function regenerateSection({ section, topic, customInstruction = '' }) {
  const res = await fetch(`${API_BASE}/api/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      section,
      topic,
      custom_instruction: customInstruction,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to regenerate section');
  }
  return data;
}

export async function generateMoreQuiz({ topic, difficulty = 'medium', count = 5 }) {
  const res = await fetch(`${API_BASE}/api/quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      difficulty,
      count,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate extra quiz questions');
  }
  return data.questions;
}

export function getPDFUrl(docId) {
  return `${API_BASE}/api/pdf/${docId}`;
}
