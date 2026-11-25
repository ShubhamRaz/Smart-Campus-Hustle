import React, { FormEvent, useEffect, useState } from 'react';
import { Check, CheckSquare, Plus, Trash2 } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const initialItems: ChecklistItem[] = [
  { id: 'timetable', text: 'Review my class timetable', completed: false },
  { id: 'fees', text: 'Check my fee balance', completed: false },
  { id: 'student-id', text: 'Keep my digital student ID handy', completed: false }
];

const getStorageKey = (userId?: string) => `mewar-campus-checklist:${userId || 'guest'}`;

export const MewarChecklist: React.FC<{ userId?: string }> = ({ userId }) => {
  const storageKey = getStorageKey(userId);
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [newItem, setNewItem] = useState('');
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setItems(initialItems);
        setStorageError('');
        return;
      }

      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed) || !parsed.every((item) =>
        item && typeof item.id === 'string' &&
        typeof item.text === 'string' &&
        typeof item.completed === 'boolean'
      )) {
        throw new Error('Saved checklist has an invalid format.');
      }

      setItems(parsed);
      setStorageError('');
    } catch (error) {
      console.error('Unable to load campus checklist:', error);
      setItems(initialItems);
      setStorageError('Could not load your saved checklist. Changes may not persist.');
    }
  }, [storageKey]);

  const saveItems = (nextItems: ChecklistItem[]) => {
    setItems(nextItems);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextItems));
      setStorageError('');
    } catch (error) {
      console.error('Unable to save campus checklist:', error);
      setStorageError('Could not save your checklist on this device.');
    }
  };

  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = newItem.trim();
    if (!text) return;

    saveItems([...items, { id: crypto.randomUUID(), text, completed: false }]);
    setNewItem('');
  };

  const completedCount = items.filter((item) => item.completed).length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="checklist-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-campus-50 text-campus-600">
              <CheckSquare className="h-4 w-4" />
            </div>
            <h3 id="checklist-heading" className="font-bold text-slate-900">My campus checklist</h3>
          </div>
          <p className="mt-2 text-xs text-slate-500">A personal list, saved on this device.</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {completedCount}/{items.length} done
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
            <button
              type="button"
              onClick={() => saveItems(items.map((entry) =>
                entry.id === item.id ? { ...entry, completed: !entry.completed } : entry
              ))}
              aria-label={`${item.completed ? 'Mark incomplete' : 'Complete'}: ${item.text}`}
              aria-pressed={item.completed}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                item.completed
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300 text-transparent hover:border-campus-500'
              }`}
            >
              <Check className="h-3 w-3" />
            </button>
            <span className={`min-w-0 flex-1 text-xs ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => saveItems(items.filter((entry) => entry.id !== item.id))}
              aria-label={`Remove: ${item.text}`}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
            Your checklist is clear. Add a task to get started.
          </li>
        )}
      </ul>

      <form onSubmit={addItem} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="campus-checklist-item">Add a checklist item</label>
        <input
          id="campus-checklist-item"
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          maxLength={100}
          placeholder="Add a personal task..."
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-campus-500 focus:ring-2 focus:ring-campus-100"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
          className="inline-flex items-center gap-1 rounded-xl bg-campus-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-campus-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </form>

      {storageError && <p role="status" className="mt-2 text-[11px] text-amber-700">{storageError}</p>}
    </section>
  );
};
