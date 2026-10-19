import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../../api';
import { useCategories } from '../../hooks/useCategories';
import type { Category } from '../../types';

export default function AdminCategories() {
  const { categories, loading, error: loadError, reload } = useCategories();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    void run(async () => {
      await api.createCategory(newName.trim());
      setNewName('');
      setNotice('Category created.');
    });
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setError('');
    setNotice('');
  }

  function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;
    void run(async () => {
      await api.updateCategory(editingId, editName.trim());
      setEditingId(null);
      setNotice('Category renamed.');
    });
  }

  function handleDelete(c: Category) {
    const ok = window.confirm(
      `Delete "${c.name}"?\n\nAny expenses in this category will be moved to "Uncategorized".`
    );
    if (!ok) return;
    void run(async () => {
      const result = await api.deleteCategory(c.id);
      setNotice(result.message);
    });
  }

  return (
    <section className="card">
      <h2>Expense categories</h2>
      <p className="muted">
        Deleting a category moves its expenses to the default <strong>Uncategorized</strong> category, which can't be
        renamed or deleted.
      </p>

      <form className="inline-form" onSubmit={handleCreate}>
        <label className="sr-only" htmlFor="new-category">
          New category name
        </label>
        <input
          id="new-category"
          type="text"
          maxLength={40}
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !newName.trim()}>
          Add category
        </button>
      </form>

      {(error || loadError) && (
        <div className="alert alert-error" role="alert">
          {error || loadError}
        </div>
      )}
      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="spinner" role="status" aria-label="Loading" />
      ) : (
        <ul className="plain-list category-list">
          {categories.map((c) => (
            <li key={c.id}>
              {editingId === c.id ? (
                <form className="inline-form grow" onSubmit={handleUpdate}>
                  <label className="sr-only" htmlFor={`edit-${c.id}`}>
                    Category name
                  </label>
                  <input
                    id={`edit-${c.id}`}
                    type="text"
                    maxLength={40}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-sm" type="submit" disabled={busy || !editName.trim()}>
                    Save
                  </button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span>
                    {c.name}
                    {c.isDefault && <span className="badge badge-default">default</span>}
                  </span>
                  {!c.isDefault && (
                    <span className="row-actions">
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(c)} disabled={busy}>
                        Rename
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-danger"
                        type="button"
                        onClick={() => handleDelete(c)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
