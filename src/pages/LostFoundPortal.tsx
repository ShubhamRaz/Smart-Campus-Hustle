import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Search, MapPin, CheckCircle2, Plus, Clock, ShieldCheck, Tag } from 'lucide-react';

export const LostFoundPortal: React.FC = () => {
  const { tenant, user } = useAuth();
  const { addNotification } = useNotifications();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [itemType, setItemType] = useState<'LOST' | 'FOUND'>('LOST');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ELECTRONICS');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLostFound();
  }, [tenant]);

  const fetchLostFound = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lost-found', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/lost-found', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({
          itemType,
          title,
          category,
          location,
          description,
          photoUrl: photoUrl || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300'
        })
      });

      if (res.ok) {
        addNotification(
          `${itemType} Item Registered`,
          `Posted to campus security bulletin board.`,
          'SUCCESS'
        );
        setShowModal(false);
        setTitle('');
        setLocation('');
        setDescription('');
        fetchLostFound();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-campus-600" />
            Lost & Found Property Vault
          </h2>
          <p className="text-xs text-slate-500">
            Module 16: Visual item directory, photograph verification, security custody signoff & claims
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-campus-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Report Lost or Found Item</span>
        </button>
      </div>

      {/* Items Directory */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Campus Property Bulletin</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {items.map((item) => (
            <div key={item.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.item_type === 'FOUND' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.item_type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.category}</span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
                <p className="text-slate-600 text-[11px] mb-2">{item.description}</p>
                <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.location}
                </div>

                {item.photo_url && (
                  <img
                    src={item.photo_url}
                    alt={item.title}
                    className="mt-3 w-full h-36 object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Reported by: {item.reported_by_name}</span>
                <button
                  onClick={() => alert(`Claim Verification: To claim '${item.title}', visit Security Desk at Gate 1 with proof of ownership or device serial number.`)}
                  className="text-campus-600 hover:underline font-bold"
                >
                  File Ownership Claim
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900">Report Property</h3>
            <form onSubmit={handleReport} className="space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setItemType('LOST')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                    itemType === 'LOST' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  I Lost Something
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('FOUND')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                    itemType === 'FOUND' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  I Found An Item
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Silver AirPods Pro Case with blue silicone skin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="ELECTRONICS">Electronics / Audio</option>
                    <option value="WALLET_ID">Wallet / Govt ID</option>
                    <option value="KEYS">Keys & Access Cards</option>
                    <option value="BOOKS">Books & Notebooks</option>
                    <option value="ACCESSORIES">Clothing & Bags</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Turing Hall 401"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Identifying Marks</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include scratches, stickers, brand marks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-campus-600 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Submit to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
