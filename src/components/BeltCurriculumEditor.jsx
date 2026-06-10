import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllRequirementsForBeltAdmin,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  updateBeltRank,
  seedFullCurriculumFromApp,
} from '../services/curriculumService';
import { REQUIREMENT_TYPES } from '../constants/roles';
import { REQUIREMENT_TYPE_LABELS } from '../data/curriculumSeed';

const EMPTY_REQ = {
  type: REQUIREMENT_TYPES.TECHNIQUE,
  title: '',
  description: '',
  sort_order: 0,
  content: {},
  published: true,
};

export default function BeltCurriculumEditor({ belt, onClose, onUpdated }) {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_REQ);
  const [beltForm, setBeltForm] = useState({ name: belt.name, korean: belt.korean, color: belt.color, text_color: belt.text_color });
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  const loadReqs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllRequirementsForBeltAdmin(belt.id);
      setRequirements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [belt.id]);

  useEffect(() => {
    loadReqs();
  }, [loadReqs]);

  async function handleSaveBelt(e) {
    e.preventDefault();
    setError('');
    try {
      await updateBeltRank(belt.id, beltForm);
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveReq(e) {
    e.preventDefault();
    setError('');
    try {
      const slug = form.slug ?? form.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40);
      if (editing) {
        await updateRequirement(editing, { ...form, slug });
      } else {
        await createRequirement({
          ...form,
          slug,
          belt_rank_id: belt.id,
          sort_order: requirements.length + 1,
        });
      }
      setEditing(null);
      setForm(EMPTY_REQ);
      setShowForm(false);
      await loadReqs();
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this requirement?')) return;
    await deleteRequirement(id);
    await loadReqs();
    onUpdated?.();
  }

  async function handleSeedAll() {
    setSeeding(true);
    try {
      await seedFullCurriculumFromApp();
      await loadReqs();
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="curriculum-editor">
      <div className="curriculum-editor__header">
        <h2>{belt.name}</h2>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
      </div>

      {error && <div className="auth-banner auth-banner--error">{error}</div>}

      <form onSubmit={handleSaveBelt} className="settings-form">
        <label className="auth-field">
          <span>Name</span>
          <input value={beltForm.name} onChange={(e) => setBeltForm({ ...beltForm, name: e.target.value })} />
        </label>
        <label className="auth-field">
          <span>Korean</span>
          <input value={beltForm.korean ?? ''} onChange={(e) => setBeltForm({ ...beltForm, korean: e.target.value })} />
        </label>
        <div className="form-row">
          <label className="auth-field">
            <span>Color</span>
            <input type="color" value={beltForm.color} onChange={(e) => setBeltForm({ ...beltForm, color: e.target.value })} />
          </label>
          <label className="auth-field">
            <span>Text color</span>
            <input type="color" value={beltForm.text_color} onChange={(e) => setBeltForm({ ...beltForm, text_color: e.target.value })} />
          </label>
        </div>
        <button type="submit" className="btn btn-secondary btn-sm">Save belt</button>
      </form>

      <div className="curriculum-editor__actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditing(null); setForm(EMPTY_REQ); setShowForm(true); }}>
          + Add requirement
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleSeedAll} disabled={seeding}>
          {seeding ? 'Seeding…' : 'Seed full WT curriculum'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveReq} className="settings-form curriculum-editor__form">
          <label className="auth-field">
            <span>Type</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(REQUIREMENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="auth-field">
            <span>Title</span>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="auth-field">
            <span>Description</span>
            <input value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="auth-field">
            <span>Content (JSON)</span>
            <textarea
              rows={4}
              value={JSON.stringify(form.content ?? {}, null, 2)}
              onChange={(e) => {
                try { setForm({ ...form, content: JSON.parse(e.target.value) }); } catch { /* typing */ }
              }}
            />
          </label>
          <label className="auth-field checkbox-field">
            <input type="checkbox" checked={form.published !== false} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            <span>Published</span>
          </label>
          <div className="form-row">
            <button type="submit" className="btn btn-primary btn-sm">{editing ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditing(null); setForm(EMPTY_REQ); setShowForm(false); }}>Cancel</button>
          </div>
        </form>
      )}

      <section className="panel">
        <div className="panel__head">
          <h3>Requirements</h3>
          <span className="panel__meta">{requirements.length}</span>
        </div>
        {loading ? (
          <p className="empty-note">Loading…</p>
        ) : requirements.length === 0 ? (
          <p className="empty-note">No requirements yet. Add one or seed the full curriculum.</p>
        ) : (
          <ul className="req-list">
            {requirements.map((req) => (
              <li key={req.id} className="req-list__item">
                <div className="req-list__body">
                  <strong>{req.title}</strong>
                  <p>{REQUIREMENT_TYPE_LABELS[req.type]} · {req.published ? 'Published' : 'Draft'}</p>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditing(req.id); setForm(req); setShowForm(true); }}>Edit</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDelete(req.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
