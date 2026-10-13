import React, { useState, useEffect } from 'react';
import { Plus, Star, Trash2, Copy, Check, Palette, Search, Filter, Edit3, X } from 'lucide-react';

const COLOR_OPTIONS = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];
const CATEGORY_OPTIONS = [
  'All',
  'Important',
  'Definition',
  'Formula',
  'Keyword',
  'Memory Trick',
  'Difference',
  'Common Mistake',
  'Exam Tip',
  'Viva Question',
];

export default function StickyNotesTab({ initialNotes = [], onUpdateNotes }) {
  const [notes, setNotes] = useState(initialNotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingNote, setEditingNote] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Sync when initialNotes changes
  useEffect(() => {
    if (initialNotes && initialNotes.length > 0) {
      setNotes(initialNotes);
    }
  }, [initialNotes]);

  const updateNotesState = (updatedList) => {
    setNotes(updatedList);
    if (onUpdateNotes) {
      onUpdateNotes(updatedList);
    }
  };

  const handleToggleImportant = (id) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, is_important: !n.is_important } : n));
    updateNotesState(updated);
  };

  const handleDelete = (id) => {
    const updated = notes.filter((n) => n.id !== id);
    updateNotesState(updated);
  };

  const handleCycleColor = (id) => {
    const updated = notes.map((n) => {
      if (n.id === id) {
        const currentIdx = COLOR_OPTIONS.indexOf(n.color || 'yellow');
        const nextColor = COLOR_OPTIONS[(currentIdx + 1) % COLOR_OPTIONS.length];
        return { ...n, color: nextColor };
      }
      return n;
    });
    updateNotesState(updated);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAddNote = () => {
    const newNote = {
      id: `sn-custom-${Date.now()}`,
      title: 'New Revision Point',
      content: 'Click edit to record your exam tip, formula, or definition...',
      color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)],
      category: 'Exam Tip',
      is_important: false,
    };
    const updated = [newNote, ...notes];
    updateNotesState(updated);
    setEditingNote(newNote);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingNote) return;
    const updated = notes.map((n) => (n.id === editingNote.id ? editingNote : n));
    updateNotesState(updated);
    setEditingNote(null);
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Important') return n.is_important;
    return n.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div>
      {/* HEADER CONTROLS */}
      <div className="sticky-board-header">
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Digital Revision Sticky Board</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Editable bite-sized revision cards with definitions, formulas, memory tricks, and viva questions.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleAddNote} style={{ padding: '0.55rem 1.15rem' }}>
          <Plus size={18} />
          <span>Add Sticky Note</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search sticky notes by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.4rem', fontSize: '0.88rem', padding: '0.55rem 0.85rem 0.55rem 2.4rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat}
              className={`pill-option ${selectedCategory === cat ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'Important' ? '⭐ Important' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* STICKY NOTES GRID */}
      {filteredNotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No sticky notes found matching your filter criteria.</p>
        </div>
      ) : (
        <div className="sticky-grid">
          {filteredNotes.map((note) => {
            const colorClass = `sticky-${note.color || 'yellow'}`;

            return (
              <div key={note.id} className={`sticky-card ${colorClass}`}>
                <div>
                  <div className="sticky-top">
                    <span className="sticky-tag">{note.category || 'Note'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => handleToggleImportant(note.id)}
                        title={note.is_important ? 'Starred' : 'Mark as important'}
                        style={{ color: note.is_important ? '#eab308' : 'rgba(0,0,0,0.3)', padding: '2px' }}
                      >
                        <Star size={18} fill={note.is_important ? '#eab308' : 'none'} />
                      </button>
                    </div>
                  </div>

                  <h4 className="sticky-title">{note.title}</h4>
                  <p className="sticky-content">{note.content}</p>
                </div>

                <div className="sticky-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      onClick={() => handleCycleColor(note.id)}
                      title="Change card color"
                      style={{ padding: '4px', borderRadius: '4px', color: 'rgba(0,0,0,0.5)' }}
                    >
                      <Palette size={15} />
                    </button>
                    <button
                      onClick={() => setEditingNote(note)}
                      title="Edit note"
                      style={{ padding: '4px', borderRadius: '4px', color: 'rgba(0,0,0,0.5)' }}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleCopy(note.id, `${note.title}\n${note.content}`)}
                      title="Copy note text"
                      style={{ padding: '4px', borderRadius: '4px', color: 'rgba(0,0,0,0.5)' }}
                    >
                      {copiedId === note.id ? <Check size={15} color="#15803d" /> : <Copy size={15} />}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(note.id)}
                    title="Delete note"
                    style={{ padding: '4px', borderRadius: '4px', color: 'rgba(0,0,0,0.4)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingNote && (
        <div className="modal-overlay" onClick={() => setEditingNote(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Edit Sticky Note</h3>
              <button onClick={() => setEditingNote(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={editingNote.category}
                  onChange={(e) => setEditingNote({ ...editingNote, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.filter((c) => c !== 'All' && c !== 'Important').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Note Content</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Color Theme</label>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingNote({ ...editingNote, color: c })}
                      className={`sticky-${c}`}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: editingNote.color === c ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingNote(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
