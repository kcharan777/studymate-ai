import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroGenerator from './components/HeroGenerator';
import StudyWorkspace from './components/StudyWorkspace';
import UserGuideModal from './components/UserGuideModal';
import AISettingsModal from './components/AISettingsModal';
import { checkHealth } from './services/api';

const STORAGE_KEY = 'studymate_saved_kits_v1';

export default function App() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [activeKit, setActiveKit] = useState(null);
  const [docData, setDocData] = useState(null);
  const [savedKits, setSavedKits] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check backend health
    checkHealth().then(setBackendStatus);

    // Load saved kits from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedKits(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not parse saved kits from localStorage', e);
    }
  }, []);

  const handleKitGenerated = (kit, doc) => {
    setActiveKit(kit);
    setDocData(doc);

    // Save to localStorage
    try {
      const updatedList = [
        kit,
        ...savedKits.filter((k) => (k.overview?.title || k.topic) !== (kit.overview?.title || kit.topic)),
      ].slice(0, 10);
      setSavedKits(updatedList);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Could not persist kit to localStorage', e);
    }
  };

  const handleUpdateKit = (updatedKit) => {
    setActiveKit(updatedKit);
    // Persist changes
    try {
      const updatedList = savedKits.map((k) =>
        (k.overview?.title || k.topic) === (updatedKit.overview?.title || updatedKit.topic) ? updatedKit : k
      );
      setSavedKits(updatedList);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Failed to update saved kits in localStorage', e);
    }
  };

  const handleLoadSavedKit = (kit) => {
    setActiveKit(kit);
    setDocData(null); // Document was cached previously or topic-only
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setActiveKit(null);
    setDocData(null);
  };

  return (
    <div className="app-container">
      <Navbar
        backendStatus={backendStatus}
        onReset={handleReset}
        onOpenHelp={() => setShowGuide(true)}
        onOpenSettings={() => setShowSettings(true)}
        activeKit={activeKit}
      />

      <main style={{ flex: 1 }}>
        {!activeKit ? (
          <HeroGenerator
            onKitGenerated={handleKitGenerated}
            savedKits={savedKits}
            onLoadSavedKit={handleLoadSavedKit}
          />
        ) : (
          <StudyWorkspace
            kit={activeKit}
            docData={docData}
            onBackToHero={handleReset}
            onUpdateKit={handleUpdateKit}
          />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', background: '#ffffff', padding: '1.5rem 2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p>
          <strong>StudyMate AI</strong> — Built for college students, academic researchers, and university exam preparation across all disciplines.
        </p>
      </footer>

      <UserGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />

      <AISettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        backendStatus={backendStatus}
        onStatusUpdated={setBackendStatus}
      />
    </div>
  );
}
