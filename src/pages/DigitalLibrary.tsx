import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { BookOpen, Search, Bookmark, Clock, CheckCircle2, AlertCircle, Download, QrCode } from 'lucide-react';

export const DigitalLibrary: React.FC = () => {
  const { tenant } = useAuth();
  const { addNotification } = useNotifications();

  const [books, setBooks] = useState<any[]>([]);
  const [userIssues, setUserIssues] = useState<any[]>([]);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLibraryData();
  }, [tenant]);

  const fetchLibraryData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/library/books', {
        headers: {
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
        setUserIssues(data.userIssues || []);
        setUserReservations(data.userReservations || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (bookId: string) => {
    try {
      const res = await fetch('/api/library/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        },
        body: JSON.stringify({ bookId })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification('Book Reserved', `Added to reservation queue at position #${data.queueNumber}.`, 'SUCCESS');
        fetchLibraryData();
      }
    } catch {
      alert('Failed to reserve book.');
    }
  };

  const handleTurnstileEntry = async () => {
    try {
      const res = await fetch('/api/library/turnstile-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant?.id || 'tenant_apex',
          'Authorization': `Bearer ${localStorage.getItem('smart_campus_token')}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        addNotification('Library Turnstile Verified', data.message, 'SUCCESS');
      }
    } catch {
      alert('Turnstile scan failed.');
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-campus-600" />
            Central Digital Library & E-Resource Hub
          </h2>
          <p className="text-xs text-slate-500">
            Module 7: Real-time book catalogue, instant reservation queue, loans & fines, e-books & turnstile scanning
          </p>
        </div>

        <button
          onClick={handleTurnstileEntry}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-slate-900/20"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>Tap Digital ID at Library Gate</span>
        </button>
      </div>

      {/* User Active Loans & Reservations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-campus-600" /> Active Book Loans & Due Dates
          </h3>
          {userIssues.length > 0 ? (
            <div className="space-y-2 text-xs">
              {userIssues.map((issue) => (
                <div key={issue.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">{issue.title}</div>
                    <div className="text-slate-500 text-[11px]">{issue.author}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                      Due: {issue.due_date}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{issue.fine_amount ? `Fine: ₹${issue.fine_amount}` : 'No fine accrued'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs">No active books currently borrowed.</p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-600" /> Reservation Queue Position
          </h3>
          {userReservations.length > 0 ? (
            <div className="space-y-2 text-xs">
              {userReservations.map((res) => (
                <div key={res.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">{res.title}</div>
                    <div className="text-slate-500 text-[11px]">Reserved: {res.author}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                    Queue #{res.queue_number}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs">No pending book reservations.</p>
          )}
        </div>
      </div>

      {/* Catalogue & Search */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">University Book & E-Book Catalogue</h3>
            <p className="text-xs text-slate-400">Search over physical shelves and digital repository</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, author, category..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-campus-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {filteredBooks.map((b) => (
            <div key={b.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded text-[10px]">
                    ISBN: {b.isbn}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    b.available_copies > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {b.available_copies > 0 ? `${b.available_copies} Available` : 'Reserved Out'}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mb-1">{b.title}</h4>
                <div className="text-slate-600 text-[11px] mb-2">{b.author}</div>
                <div className="text-slate-500 text-[10px]">
                  Category: <strong>{b.category}</strong> • Shelf: <strong className="text-slate-800">{b.shelf_location}</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                {b.is_ebook ? (
                  <button
                    onClick={() => alert(`Opening Digital E-Book Reader: ${b.title}\nFormat: PDF / EPUB\nLink: ${b.ebook_url}`)}
                    className="text-campus-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" /> Read E-Book
                  </button>
                ) : (
                  <span className="text-slate-400 text-[10px]">Physical Copy Only</span>
                )}

                <button
                  onClick={() => handleReserve(b.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px]"
                >
                  Reserve Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
