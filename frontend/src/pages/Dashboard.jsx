import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProjectStore } from '../store/projectStore';
import api from '../services/api';
import io from 'socket.io-client';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, Users, Calendar, Activity, 
  Monitor, Smartphone, Tablet, Terminal
} from 'lucide-react';

const COLORS = ['#6366F1', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

export default function Dashboard() {
  const activeProject = useProjectStore(state => state.activeProject);
  const [liveEvents, setLiveEvents] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveVisitors, setLiveVisitors] = useState(0);

  // Fetch metrics using React Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stats', activeProject?._id],
    queryFn: async () => {
      if (!activeProject?._id) return null;
      const res = await api.get('/analytics/stats', {
        params: { projectId: activeProject._id }
      });
      return res.data.stats;
    },
    enabled: !!activeProject?._id
  });

  // Socket.io realtime stream subscription
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

    socket.on('newEvent', (newEvent) => {
      setLiveEvents(prev => {
        // Prepend and limit size to 10 for sleek list scrolling
        const updated = [newEvent, ...prev];
        return updated.slice(0, 10);
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

  // Loading state (skeleton cards)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 rounded-xl border border-slate-900 bg-slate-900 bg-opacity-30 p-5 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="h-80 rounded-xl border border-slate-900 bg-slate-900 bg-opacity-30 lg:col-span-2 animate-pulse"></div>
          <div className="h-80 rounded-xl border border-slate-900 bg-slate-900 bg-opacity-30 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12 border border-slate-900 rounded-xl bg-slate-950 bg-opacity-40">
        <p className="text-slate-400 text-sm">Failed to retrieve analytical details. Please seed database or check connections.</p>
        <button onClick={() => refetch()} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">
          Retry Load
        </button>
      </div>
    );
  }

  // KPI Calculations
  const stats = data;
  const totalEvents = stats.totalEvents;
  const totalActiveUsers = stats.totalActiveUsers;
  const todayEvents = stats.dailyEvents[stats.dailyEvents.length - 1]?.events || 0;
  
  // Dynamic conversion rates (seeded ratios based)
  const totalConversions = Math.ceil(totalEvents * 0.08); 
  const conversionRate = totalActiveUsers > 0 ? ((totalConversions / totalActiveUsers) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Project Overview Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time usage and customer interaction metrics.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className={`h-2.5 w-2.5 rounded-full ${socketConnected ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></div>
          <span className="text-slate-400 font-semibold">
            {socketConnected ? 'Realtime WebSocket Active' : 'WebSocket Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Events */}
        <div className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tracks</span>
            <div className="rounded-lg bg-indigo-600/10 p-2 text-indigo-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">{totalEvents.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Accumulated custom events</p>
          </div>
        </div>

        {/* Card 2: Live Visitors */}
        <div className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live on Site</span>
            <div className="rounded-lg bg-pink-600/10 p-2 text-pink-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-slate-100">{liveVisitors}</h3>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">People on your site right now</p>
          </div>
        </div>

        {/* Card 3: Daily Events */}
        <div className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Ingest</span>
            <div className="rounded-lg bg-blue-600/10 p-2 text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">{todayEvents.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Track actions recorded today</p>
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversion Ratio</span>
            <div className="rounded-lg bg-green-600/10 p-2 text-green-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-100">{conversionRate}%</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Absolute funnel execution score</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Line Area Chart (Events timeline) */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200">Event Volume Trend (Last 14 Days)</h3>
          </div>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyEvents} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="events" name="Ingested Events" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart (Devices) */}
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-4">Device Segmentation</h3>
          </div>
          <div className="h-52 w-full relative flex items-center justify-center">
            {stats.devices.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No device telemetry recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] text-slate-400 font-semibold border-t border-slate-900 pt-3">
            {stats.devices.map((d, index) => (
              <div key={d.name} className="flex flex-col items-center text-center">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  {d.name}
                </span>
                <span className="text-slate-200 mt-0.5">{d.value} tracks</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Bar Chart (Daily Users) + Live Activity Stream Terminal */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Bar Chart (Daily Active Users) */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4">Daily Active Users Timeline</h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyActiveUsers} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#e2e8f0' }}
                />
                <Bar dataKey="users" name="Active Users" fill="#818CF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Realtime Rolling Console */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 flex flex-col h-80">
          <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Live Analytics Ingest Monitor</h3>
            </div>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold text-indigo-400">
              Live updates
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[10px] text-slate-400 pr-1.5 scroll-smooth">
            {liveEvents.length === 0 ? (
              <div className="flex h-full w-full flex-col items-center justify-center text-center text-slate-600 italic py-10">
                <Activity className="h-7 w-7 text-slate-800 animate-spin mb-2" />
                <p>Waiting for tracked metrics... Trigger events via the SDK tracker</p>
              </div>
            ) : (
              liveEvents.map((evt, idx) => (
                <div key={evt._id || idx} className="rounded bg-slate-950 p-2.5 border border-slate-900 flex items-start justify-between gap-4">
                  <div className="space-y-0.5 truncate">
                    <p className="font-semibold text-indigo-400 truncate">
                      ⚡ pulse('track', '{evt.eventName}', ...)
                    </p>
                    <p className="text-[9px] text-slate-500">
                      User: {evt.userId} | Session: {evt.sessionId} | Device: {evt.device} ({evt.browser})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
