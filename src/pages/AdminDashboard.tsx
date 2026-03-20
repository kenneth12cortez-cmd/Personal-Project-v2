import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { VisitorLog } from '../types';
import { 
  Users, 
  Calendar, 
  Download, 
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

export default function AdminDashboard() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollege, setFilterCollege] = useState('All');
  const [filterReason, setFilterReason] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'day' | 'week' | 'range'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const path = 'logs';
    const q = query(collection(db, path), orderBy('timestamp', sortOrder));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VisitorLog[];
      setLogs(logsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortOrder]);

  const stats = useMemo(() => {
    const total = logs.length;
    const today = logs.filter(log => {
      if (!log.timestamp) return false;
      const date = log.timestamp instanceof Timestamp ? log.timestamp.toDate() : new Date(log.timestamp);
      return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    }).length;

    const reasons: Record<string, number> = {};
    const colleges: Record<string, number> = {};

    logs.forEach(log => {
      reasons[log.reason] = (reasons[log.reason] || 0) + 1;
      colleges[log.college] = (colleges[log.college] || 0) + 1;
    });

    const reasonData = Object.entries(reasons).map(([name, value]) => ({ name, value }));
    const collegeData = Object.entries(colleges).map(([name, value]) => ({ name, value }));

    return { 
      total, 
      today, 
      reasonData: [...reasonData].sort((a, b) => b.value - a.value),
      collegeData: [...collegeData].sort((a, b) => b.value - a.value)
    };
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    const logDate = log.timestamp instanceof Timestamp ? log.timestamp.toDate() : new Date(log.timestamp);
    
    // Search filter
    const matchesSearch = 
      log.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // College filter
    const matchesCollege = filterCollege === 'All' || log.college === filterCollege;
    
    // Reason filter
    const matchesReason = filterReason === 'All' || log.reason === filterReason;

    // Status filter
    const matchesStatus = filterStatus === 'All' || 
      (filterStatus === 'Employee' && log.isEmployee) || 
      (filterStatus === 'Student' && !log.isEmployee);

    // Date filter
    let matchesDate = true;
    const now = new Date();
    if (dateFilter === 'day') {
      matchesDate = format(logDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
    } else if (dateFilter === 'week') {
      const weekAgo = subDays(now, 7);
      matchesDate = logDate >= weekAgo && logDate <= now;
    } else if (dateFilter === 'range' && startDate && endDate) {
      matchesDate = isWithinInterval(logDate, {
        start: startOfDay(new Date(startDate)),
        end: endOfDay(new Date(endDate))
      });
    }

    return matchesSearch && matchesCollege && matchesReason && matchesStatus && matchesDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-500 font-medium">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-16 px-4 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
            <p className="text-sm text-zinc-500">Library Visitor Management System</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded border border-zinc-200 shadow-sm">
            <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Total Visitors</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded border border-zinc-200 shadow-sm">
            <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Today's Visitors</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.today}</p>
          </div>
          <div className="bg-white p-4 rounded border border-zinc-200 shadow-sm">
            <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Top College</p>
            <p className="text-lg font-bold text-zinc-900 truncate">
              {stats.collegeData[0]?.name || 'N/A'}
            </p>
          </div>
          <div className="bg-white p-4 rounded border border-zinc-200 shadow-sm">
            <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Main Reason</p>
            <p className="text-lg font-bold text-zinc-900">
              {stats.reasonData[0]?.name || 'N/A'}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
              Visitors by College
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.collegeData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    fontSize={10}
                    tick={{ fill: '#71717a' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#18181b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
              Reason for Visit
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.reasonData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.reasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', fontSize: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded px-2 py-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="all">All Time</option>
                    <option value="day">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="range">Custom Range</option>
                  </select>
                </div>

                {dateFilter === 'range' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs outline-none focus:border-zinc-900"
                    />
                    <span className="text-zinc-400 text-xs">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs outline-none focus:border-zinc-900"
                    />
                  </div>
                )}

                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 hover:bg-zinc-100 rounded transition-colors border border-zinc-200"
                  title="Toggle Sort Order"
                >
                  <ArrowUpDown className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">College:</span>
                <select
                  value={filterCollege}
                  onChange={(e) => setFilterCollege(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs outline-none focus:border-zinc-900"
                >
                  <option value="All">All</option>
                  {stats.collegeData.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Reason:</span>
                <select
                  value={filterReason}
                  onChange={(e) => setFilterReason(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs outline-none focus:border-zinc-900"
                >
                  <option value="All">All</option>
                  {stats.reasonData.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs outline-none focus:border-zinc-900"
                >
                  <option value="All">All</option>
                  <option value="Student">Student</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Visitor</th>
                  <th className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">College</th>
                  <th className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 text-sm">{log.displayName}</div>
                      <div className="text-xs text-zinc-500">{log.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-1 rounded">
                        {log.college}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{log.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        log.isEmployee 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {log.isEmployee ? 'Employee' : 'Student'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {log.timestamp ? format(log.timestamp instanceof Timestamp ? log.timestamp.toDate() : new Date(log.timestamp), 'MMM d, h:mm a') : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-zinc-500 text-sm">
              No visitor logs found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
