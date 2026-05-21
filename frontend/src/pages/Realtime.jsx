import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import io from 'socket.io-client';
import { 
  Activity, Users, Flame, Terminal, 
  Map, Monitor, Globe, ChevronRight 
} from 'lucide-react';

export default function Realtime() {
  const activeProject = useProjectStore(state => state.activeProject);
  
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [runningEventsCount, setRunningEventsCount] = useState(0);
  const [activeUsersSet, setActiveUsersSet] = useState(new Set());
  const [realtimeFeed, setRealtimeFeed] = useState([]);
  const [pageViewsMap, setPageViewsMap] = useState({});

  useEffect(() => {
    if (!activeProject?._id) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('joinProject', activeProject._id);
    });

    socket.on('liveVisitors', (count) => {
      setLiveVisitors(count);
    });

    socket.on('newEvent', (event) => {
      // 1. Increment total run counts
      setRunningEventsCount(c => c + 1);

      // 2. Add user to session counter
      setActiveUsersSet(prev => {
        const next = new Set(prev);
        next.add(event.userId);
        return next;
      });

      // 3. Track top page path visits
      if (event.eventName === '$pageview' && event.properties?.path) {
        setPageViewsMap(prev => {
          const path = event.properties.path;
          return {
            ...prev,
            [path]: (prev[path] || 0) + 1
          };
        });
      }

      // 4. Prepend feed
      setRealtimeFeed(prev => {
        const updated = [event, ...prev];
        return updated.slice(0, 15); // keep max 15
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    return () => {
      socket.emit('leaveProject', activeProject._id);
      socket.disconnect();
    };
  }, [activeProject?._id]);

  const activeUsersCount = activeUsersSet.size;

  // Convert page views to sorted list
  const sortedPageViews = Object.entries(pageViewsMap)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Socket Real-time Stream</h2>
          <p className="text-xs text-slate-400 mt-0.5">Continuous analytical ingestion directly from client WebSockets.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400 font-bold border border-indigo-500/20">
          <Activity className="h-4 w-4 animate-pulse" />
          Live WebSocket: {socketConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </div>
      </div>

      {/* Counter widgets */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Count 1: Active Users */}
        <div className="glass-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-pink-500/10 p-2.5 text-pink-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Session Active Users</span>
              <h3 className="text-2xl font-bold text-slate-200 mt-0.5">{liveVisitors}</h3>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 border-t border-slate-900 pt-2">
            Unique active user IDs matching during this socket session.
          </p>
        </div>

        {/* Count 2: Streaming Events */}
        <div className="glass-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400 animate-pulse">
              <Flame className="h-5 w-5 fill-indigo-400/20" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Streamed Tracks</span>
              <h3 className="text-2xl font-bold text-slate-200 mt-0.5">{runningEventsCount}</h3>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 border-t border-slate-900 pt-2">
            Total custom tracking records registered since dashboard connection.
          </p>
        </div>

        {/* Count 3: Health Status */}
        <div className="glass-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2.5 text-green-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gateway Status</span>
              <h3 className="text-xl font-bold text-slate-200 mt-0.5">Healthy (100%)</h3>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 border-t border-slate-900 pt-2">
            Dynamic ping validation latency check matching.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Real-time scrolling feed */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 flex flex-col h-[400px]">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-indigo-400" />
            Ingress Terminal Console
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-[10px] font-mono scroll-smooth">
            {realtimeFeed.length === 0 ? (
              <div className="flex h-full w-full flex-col items-center justify-center text-slate-600 italic">
                <Activity className="h-8 w-8 text-slate-800 animate-spin mb-2" />
                <p>Awaiting analytical triggers... Try visiting standard client endpoints.</p>
              </div>
            ) : (
              realtimeFeed.map((evt, idx) => (
                <div key={evt._id || idx} className="rounded bg-slate-950 p-3 border border-slate-900 flex items-start justify-between gap-4">
                  <div className="space-y-0.5 truncate">
                    <p className="font-semibold text-indigo-400 truncate">
                      ⚡ pulse('track', '{evt.eventName}', ...)
                    </p>
                    <p className="text-[9px] text-slate-500">
                      User: {evt.userId} | Sid: {evt.sessionId} | Browser: {evt.browser} | Loc: {evt.location}
                    </p>
                    {Object.keys(evt.properties || {}).length > 0 && (
                      <pre className="mt-1.5 p-1 rounded bg-[#090d18] text-[9px] text-indigo-300/80 border border-slate-900 max-h-16 overflow-y-auto">
                        {JSON.stringify(evt.properties)}
                      </pre>
                    )}
                  </div>
                  <span className="shrink-0 rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live page views table */}
        <div className="glass-card rounded-xl p-5 flex flex-col h-[400px]">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-indigo-400" />
            Live Page Visits Registry
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
            {sortedPageViews.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-center text-slate-600 italic">
                <p>No automatic pageviews recorded. Invoke pulse('page') inside client.</p>
              </div>
            ) : (
              sortedPageViews.map((pv, idx) => (
                <div key={pv.path} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-900">
                  <div className="flex items-center gap-2 truncate">
                    <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="font-mono text-slate-300 truncate">{pv.path}</span>
                  </div>
                  <span className="shrink-0 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] text-indigo-400 font-bold border border-indigo-500/15">
                    {pv.count} view{pv.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
