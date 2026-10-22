/**
 * StudyMate AI API Client
 * Connects React frontend with the Flask backend API.
 */

const API_BASE = ''; // Proxied via Vite config to http://localhost:5000

export const AI_KEY_STORAGE = 'studymate_custom_ai_key';
export const AI_PROVIDER_STORAGE = 'studymate_custom_ai_provider';

function getAIHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  try {
    const key = localStorage.getItem(AI_KEY_STORAGE);
    const provider = localStorage.getItem(AI_PROVIDER_STORAGE);
    if (key) {
      headers['X-AI-Key'] = key.trim();
    }
    if (provider) {
      headers['X-AI-Provider'] = provider.trim();
    }
  } catch (e) {
    // ignore
  }
  return headers;
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      headers: getAIHeaders(),
    });
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend health check error:', err);
    return {
      status: 'offline',
      active_provider: 'offline_analyzer',
      provider_label: 'Smart Offline Analyzer',
      is_ai_connected: false,
    };
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server took too long to respond.');
    }
    throw err;
  }
}

export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = {};
  const customKey = localStorage.getItem(AI_KEY_STORAGE);
  if (customKey) headers['X-AI-Key'] = customKey;

  const res = await fetchWithTimeout(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers,
    body: formData,
  }, 45000);

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload and parse PDF');
  }
  return data;
}

export async function generateStudyKit({ docId, topic, focusUnit, explanationMode = 'all' }) {
  const res = await fetchWithTimeout(`${API_BASE}/api/study-kit`, {
    method: 'POST',
    headers: getAIHeaders(),
    body: JSON.stringify({
      doc_id: docId,
      topic,
      focus_unit: focusUnit,
      explanation_mode: explanationMode,
    }),
  }, 120000);

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate study kit');
  }
  return data.study_kit;
}

export async function askAITutor({ question, docId, topic, history = [] }) {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: getAIHeaders(),
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

export async function regenerateSection({ section, docId, topic, customInstruction = '' }) {
  const res = await fetch(`${API_BASE}/api/regenerate`, {
    method: 'POST',
    headers: getAIHeaders(),
    body: JSON.stringify({
      section,
      doc_id: docId,
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

export async function generateMoreQuiz({ docId, topic, difficulty = 'medium', count = 5 }) {
  const res = await fetch(`${API_BASE}/api/quiz`, {
    method: 'POST',
    headers: getAIHeaders(),
    body: JSON.stringify({
      doc_id: docId,
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

export async function testAPIKey({ apiKey, provider }) {
  const res = await fetch(`${API_BASE}/api/settings/test-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, provider }),
  });
  return await res.json();
}

export async function saveAPIKey({ apiKey, provider }) {
  const res = await fetch(`${API_BASE}/api/settings/save-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, provider }),
  });
  return await res.json();
}

export function getPDFUrl(docId) {
  return `${API_BASE}/api/pdf/${docId}`;
}
