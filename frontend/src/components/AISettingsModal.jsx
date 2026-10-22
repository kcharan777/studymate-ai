import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, CheckCircle, AlertCircle, ExternalLink, Cpu, ShieldCheck } from 'lucide-react';
import { testAPIKey, saveAPIKey, AI_KEY_STORAGE, AI_PROVIDER_STORAGE, checkHealth } from '../services/api';

export default function AISettingsModal({ isOpen, onClose, backendStatus, onStatusUpdated }) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem(AI_KEY_STORAGE) || '';
      const storedProvider = localStorage.getItem(AI_PROVIDER_STORAGE) || 'gemini';
      setApiKey(storedKey);
      setProvider(storedProvider);
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, error: 'Please enter an API key to test' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    setSaveSuccess(false);

    try {
      const res = await testAPIKey({ apiKey: apiKey.trim(), provider });
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, error: err.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem(AI_KEY_STORAGE, trimmed);
      localStorage.setItem(AI_PROVIDER_STORAGE, provider);
      try {
        await saveAPIKey({ apiKey: trimmed, provider });
      } catch (e) {
        console.warn('Failed to save to backend env', e);
      }
    } else {
      localStorage.removeItem(AI_KEY_STORAGE);
      localStorage.removeItem(AI_PROVIDER_STORAGE);
    }

    setSaveSuccess(true);
    if (onStatusUpdated) {
      const updatedStatus = await checkHealth();
      onStatusUpdated(updatedStatus);
    }
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleClear = async () => {
    localStorage.removeItem(AI_KEY_STORAGE);
    localStorage.removeItem(AI_PROVIDER_STORAGE);
    setApiKey('');
    setTestResult(null);
    setSaveSuccess(true);
    if (onStatusUpdated) {
      const updatedStatus = await checkHealth();
      onStatusUpdated(updatedStatus);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%', borderRadius: 'var(--radius-lg)', padding: '2rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: '#ede9fe', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <Cpu size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                AI Engine & Key Settings
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Configure real AI providers or use the Smart Document Analyzer
              </p>
            </div>
          </div>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '0.4rem', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* STATUS BANNER */}
        <div style={{
          background: backendStatus?.is_ai_connected ? '#ecfdf5' : '#f8fafc',
          border: `1px solid ${backendStatus?.is_ai_connected ? '#a7f3d0' : 'var(--border)'}`,
          padding: '0.9rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <ShieldCheck size={20} color={backendStatus?.is_ai_connected ? '#059669' : 'var(--primary)'} />
          <div style={{ fontSize: '0.88rem' }}>
            <strong>Active Mode: </strong>
            <span style={{ color: backendStatus?.is_ai_connected ? '#059669' : 'var(--primary)', fontWeight: 600 }}>
              {backendStatus?.provider_label || 'Smart Document Intelligence'}
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {backendStatus?.is_ai_connected
                ? 'Cloud AI is connected and active for all document analyses.'
                : 'Zero setup required: Offline Semantic Analyzer extracts real concepts, diagrams, and quizzes directly from your uploaded PDF.'}
            </div>
          </div>
        </div>

        {/* PROVIDER SELECTOR */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.45rem', color: 'var(--text-main)' }}>
            Select AI Provider
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn ${provider === 'gemini' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setProvider('gemini')}
              style={{ justifyContent: 'center', fontSize: '0.85rem', padding: '0.6rem' }}
            >
              Google Gemini (Free)
            </button>
            <button
              type="button"
              className={`btn ${provider === 'openrouter' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setProvider('openrouter')}
              style={{ justifyContent: 'center', fontSize: '0.85rem', padding: '0.6rem' }}
            >
              OpenRouter AI
            </button>
          </div>
        </div>

        {/* API KEY INPUT */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {provider === 'gemini' ? 'Gemini API Key' : 'OpenRouter API Key'}
            </label>
            {provider === 'gemini' ? (
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
              >
                <span>Get Free Key</span>
                <ExternalLink size={12} />
              </a>
            ) : (
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
              >
                <span>Get OpenRouter Key</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
                setSaveSuccess(false);
              }}
              placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-or-v1-...'}
              style={{
                width: '100%',
                padding: '0.75rem 3rem 0.75rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Your key stays in your local browser and connects directly to the provider for real document analysis.
          </div>
        </div>

        {/* TEST RESULT FEEDBACK */}
        {testResult && (
          <div style={{
            background: testResult.success ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${testResult.success ? '#a7f3d0' : '#fecaca'}`,
            color: testResult.success ? '#065f46' : '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            {testResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>
              {testResult.success
                ? `Connection verified! Ready to analyze with ${testResult.provider}.`
                : `Error: ${testResult.error || 'Failed to connect.'}`}
            </span>
          </div>
        )}

        {saveSuccess && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <CheckCircle size={18} />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleClear}
            style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}
          >
            Reset to Offline Engine
          </button>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleTest}
              disabled={isTesting || !apiKey.trim()}
              style={{ fontSize: '0.85rem' }}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              style={{ fontSize: '0.85rem' }}
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
