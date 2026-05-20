import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProjectStore } from '../store/projectStore';
import api from '../services/api';
import { 
  Download, Search, Filter, Calendar, 
  ArrowLeft, ArrowRight, Eye, RefreshCw, X
} from 'lucide-react';

export default function Events() {
  const activeProject = useProjectStore(state => state.activeProject);

  // States for search and pagination filters
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventNameFilter, setEventNameFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch events using React Query
  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ['events', activeProject?._id, page, searchTerm, eventNameFilter, userIdFilter, startDate, endDate],
    queryFn: async () => {
      if (!activeProject?._id) return null;
      const res = await api.get('/events', {
        params: {
          projectId: activeProject._id,
          page,
          limit: 15,
          search: searchTerm,
          eventName: eventNameFilter,
          userId: userIdFilter,
          startDate,
          endDate
        }
      });
      return res.data;
    },
    enabled: !!activeProject?._id,
    placeholderData: (prev) => prev
  });

  const handleCsvExport = () => {
    if (!activeProject?._id) return;
    
    // Construct dynamic download link
    const queryParams = new URLSearchParams({
      projectId: activeProject._id,
      search: searchTerm,
      eventName: eventNameFilter,
      userId: userIdFilter,
      startDate,
      endDate
    });

    const token = localStorage.getItem('pulse_token');
    const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/events/export?${queryParams.toString()}`;

    // Request via fetch to get authenticated download link (or browser redirect)
    // The cleanest way is using window.open or fetch with bearer token
    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pulse-events-${activeProject.name}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => alert('CSV download failed'));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setEventNameFilter('');
    setUserIdFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const events = data?.events || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, totalEvents: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Event Ledger Explorer</h2>
          <p className="text-xs text-slate-400 mt-0.5">Inspect raw analytics payloads and device metrics.</p>
        </div>
        <div className="flex items-center gap-3 font-semibold text-xs">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 bg-opacity-40 px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
          <button
            onClick={handleCsvExport}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-white shadow-neon transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-card rounded-xl p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5 text-xs">
        {/* Search bar */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Global Keyword</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Search values..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Event name filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Event Action Name</label>
          <input
            type="text"
            value={eventNameFilter}
            onChange={(e) => { setEventNameFilter(e.target.value); setPage(1); }}
            placeholder="e.g. Purchase Successful"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* User filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer User ID</label>
          <input
            type="text"
            value={userIdFilter}
            onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
            placeholder="e.g. usr_10002"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-3 text-slate-300 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-3 text-slate-300 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic">
            <div className="h-8 w-8 border-t-2 border-indigo-500 rounded-full animate-spin mb-3"></div>
            <p className="text-xs">Loading analytics list...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-slate-500 italic text-xs">
            <Filter className="h-8 w-8 text-slate-800 mx-auto mb-3" />
            <p>No matching analytical events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Event Name</th>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Session ID</th>
                  <th className="px-6 py-4">Device</th>
                  <th className="px-6 py-4">Browser</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {events.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-400">{e.eventName}</td>
                    <td className="px-6 py-4 font-mono truncate max-w-[120px]">{e.userId}</td>
                    <td className="px-6 py-4 font-mono truncate max-w-[120px]">{e.sessionId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold
                        ${e.device === 'Mobile' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/15' : 
                          e.device === 'Tablet' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/15' : 
                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'}
                      `}>
                        {e.device}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{e.browser}</td>
                    <td className="px-6 py-4 text-slate-300">{e.location}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(e.timestamp).toLocaleDateString()} {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedEvent(e)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        <div className="flex items-center justify-between border-t border-slate-900 bg-slate-950/40 px-6 py-4 text-xs font-semibold">
          <div className="text-slate-400 font-medium">
            Showing <span className="text-slate-200">{events.length}</span> of{' '}
            <span className="text-slate-200">{pagination.totalEvents.toLocaleString()}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 px-3 py-2 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:border-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-slate-400 px-2 font-medium">
              Page <span className="text-slate-200">{page}</span> of <span className="text-slate-200">{pagination.totalPages}</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 px-3 py-2 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:border-slate-800"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-[#0d121f] p-6 shadow-2xl glass-card relative">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Eye className="h-4.5 w-4.5 text-indigo-400" />
              Event Payload Inspector
            </h3>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs border-b border-slate-900 pb-4">
              <div>
                <p className="text-slate-500 font-medium">Event Name</p>
                <p className="font-bold text-indigo-400 text-sm mt-0.5">{selectedEvent.eventName}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Recorded Time</p>
                <p className="text-slate-300 mt-0.5">{new Date(selectedEvent.timestamp).toString()}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Customer User ID</p>
                <p className="text-slate-300 font-mono mt-0.5">{selectedEvent.userId}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Session ID</p>
                <p className="text-slate-300 font-mono mt-0.5">{selectedEvent.sessionId}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tracked JSON Properties</p>
              <pre className="w-full rounded-lg bg-slate-950 p-4 font-mono text-[10px] text-indigo-300 overflow-x-auto border border-slate-900 max-h-56">
                {JSON.stringify(selectedEvent.properties, null, 2)}
              </pre>
            </div>

            <div className="mt-4 flex gap-4 text-[10px] text-slate-500 font-semibold border-t border-slate-900 pt-4">
              <span>Device: <strong className="text-slate-300">{selectedEvent.device}</strong></span>
              <span>Browser: <strong className="text-slate-300">{selectedEvent.browser}</strong></span>
              <span>Location: <strong className="text-slate-300">{selectedEvent.location}</strong></span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
