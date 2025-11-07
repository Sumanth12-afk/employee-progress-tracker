import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logsAPI } from '../services/api';
import { logoutUser } from '../utils/firebase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#6366F1', '#22C55E', '#F97316', '#14B8A6', '#EC4899', '#8B5CF6'];

const Dashboard = () => {
  const [analytics, setAnalytics] = useState([]);
  const [topPerformer, setTopPerformer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/');
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== 'admin' && parsed.role !== 'super-admin') {
      navigate('/employee/dashboard');
      return;
    }
    setUser(parsed);
  }, [navigate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await logsAPI.getAnalytics();
      setAnalytics(response.data.analytics || []);
      setTopPerformer(response.data.top_performer || null);
    } catch (err) {
      setError('Failed to load analytics. Please try again.');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const totals = useMemo(() => {
    const totalJobs = analytics.reduce((sum, item) => sum + (item.total_jobs || 0), 0);
    const totalSubmissions = analytics.reduce((sum, item) => sum + (item.total_submissions || 0), 0);
    const totalLogs = analytics.reduce((sum, item) => sum + (item.daily_logs?.length || 0), 0);
    const totalRecruiters = new Set(
      analytics.flatMap((item) => (item.daily_logs || []).map((log) => log.recruiter_name).filter(Boolean))
    ).size;
    return { totalJobs, totalSubmissions, totalLogs, totalRecruiters };
  }, [analytics]);

  const pieData = useMemo(() => {
    const totalJobs = analytics.reduce((sum, item) => sum + (item.total_jobs || 0), 0);
    if (totalJobs === 0) {
      return [];
    }
    return analytics.map((item) => ({
      name: item.email,
      value: item.total_jobs
    }));
  }, [analytics]);

  const flattenedLogs = useMemo(() => {
    return analytics.flatMap((item) =>
      (item.daily_logs || []).map((log) => ({
        email: item.email,
        ...log
      }))
    );
  }, [analytics]);

  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(flattenedLogs.map((log) => log.date))).sort((a, b) => b.localeCompare(a));
    return ['ALL', ...dates];
  }, [flattenedLogs]);

  const filteredLogs = useMemo(() => {
    if (selectedDate === 'ALL') {
      return [...flattenedLogs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
    return flattenedLogs
      .filter((log) => log.date === selectedDate)
      .sort((a, b) => (b.submissions_done || 0) - (a.submissions_done || 0));
  }, [flattenedLogs, selectedDate]);

  const submissionsTrend = useMemo(() => {
    const trendMap = new Map();
    flattenedLogs.forEach((log) => {
      if (!log.date) return;
      const entry = trendMap.get(log.date) || { date: log.date, submissions: 0 };
      entry.submissions += Number(log.submissions_done) || 0;
      trendMap.set(log.date, entry);
    });
    return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [flattenedLogs]);

  const engagementHeatmap = useMemo(() => {
    const dateCount = new Map();
    flattenedLogs.forEach((log) => {
      if (!log.date) return;
      dateCount.set(log.date, (dateCount.get(log.date) || 0) + 1);
    });

    const today = new Date();
    const totalDays = 42;
    const days = [];
    for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const iso = date.toISOString().slice(0, 10);
      days.push({
        date: iso,
        count: dateCount.get(iso) || 0,
        weekday: date.getDay(),
      });
    }

    const weeks = [];
    for (let index = 0; index < days.length; index += 7) {
      weeks.push(days.slice(index, index + 7));
    }

    const maxCount = days.reduce((max, day) => Math.max(max, day.count), 0);

    const getCellStyle = (count) => {
      if (count === 0 || maxCount === 0) {
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          color: '#cbd5f5',
        };
      }
      const opacity = 0.25 + (count / maxCount) * 0.6;
      return {
        backgroundColor: `rgba(16, 185, 129, ${opacity.toFixed(2)})`,
        color: '#0f172a',
        fontWeight: 600,
      };
    };

    return { weeks, getCellStyle };
  }, [flattenedLogs]);

  const handleOpenPreview = (log) => {
    if (!log?.attachment_url) return;
    const filename = log.attachment_filename || 'attachment';
    setPreview({
      url: log.attachment_url,
      filename,
      isPdf: filename.toLowerCase().endsWith('.pdf'),
    });
  };

  const handleClosePreview = () => setPreview(null);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-950 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">📘 Employee Progress Tracker Dashboard</h1>
            <p className="text-sm text-slate-400">Overview of all employee submissions stored in S3.</p>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-200">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-semibold">Analytics Overview</h2>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition-colors text-white text-sm font-medium"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Analytics'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total Logs</p>
            <p className="text-3xl font-semibold text-indigo-400 mt-1">{totals.totalLogs}</p>
          </div>
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total Jobs Applied</p>
            <p className="text-3xl font-semibold text-blue-400 mt-1">{totals.totalJobs}</p>
          </div>
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total Submissions</p>
            <p className="text-3xl font-semibold text-emerald-400 mt-1">{totals.totalSubmissions}</p>
          </div>
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Recruiters Contacted</p>
            <p className="text-3xl font-semibold text-amber-400 mt-1">{totals.totalRecruiters}</p>
          </div>
        </section>

        <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-md">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Submissions Trend</h3>
          {submissionsTrend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={submissionsTrend}>
                <XAxis dataKey="date" stroke="#CBD5F5" />
                <YAxis stroke="#CBD5F5" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '0.75rem' }} />
                <Line type="monotone" dataKey="submissions" stroke="#38BDF8" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">No submissions recorded yet.</p>
          )}
        </section>

        {topPerformer && (
          <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-md">
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Today's Highest Submissions</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-slate-300 text-sm">{topPerformer.date} • {topPerformer.day || 'Day'}</p>
                <h4 className="text-xl font-semibold text-white">{topPerformer.email}</h4>
                <p className="text-sm text-slate-300">Recruiter: {topPerformer.recruiter_name || 'N/A'}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-slate-400 text-sm">Submissions</p>
                  <p className="text-2xl font-semibold text-emerald-400">{topPerformer.submissions_done}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Jobs Applied</p>
                  <p className="text-2xl font-semibold text-indigo-400">{topPerformer.jobs_applied}</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300"><span className="font-semibold text-slate-100">Topic:</span> {topPerformer.topic_learned || '—'}</p>
            <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{topPerformer.what_you_learned || ''}</p>
            {topPerformer.attachment_url && (
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => handleOpenPreview(topPerformer)}
                  className="inline-flex items-center gap-2 text-xs text-indigo-200 hover:text-indigo-100"
                >
                  Preview attachment
                </button>
                <a
                  href={topPerformer.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-slate-200 hover:text-slate-100"
                >
                  Download ({topPerformer.attachment_filename || 'file'})
                </a>
              </div>
            )}
          </section>
        )}

        <section className="bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-slate-100">Engagement Heatmap</h3>
            <span className="text-xs text-slate-400">Logs submitted per day (last 6 weeks)</span>
          </div>
          <div className="grid grid-cols-8 gap-2 text-center text-xs text-slate-400">
            <div />
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-8 gap-2">
            <div className="grid grid-rows-7 gap-1 text-[10px] text-slate-500">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, index) => (
                <span key={`heat-label-${index}`}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {engagementHeatmap.weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} submission${day.count === 1 ? '' : 's'}`}
                      className="flex items-center justify-center rounded"
                      style={engagementHeatmap.getCellStyle(day.count)}
                    >
                      {day.count > 0 ? day.count : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-4 shadow-md">
            <h3 className="text-lg font-semibold mb-4">Jobs vs Submissions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics}>
                <XAxis dataKey="email" stroke="#CBD5F5" tick={{ fontSize: 12 }} angle={-20} dx={-10} dy={10} height={70} />
                <YAxis stroke="#CBD5F5" />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '0.5rem', border: 'none' }} />
                <Legend />
                <Bar dataKey="total_jobs" name="Jobs" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_submissions" name="Submissions" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 shadow-md">
            <h3 className="text-lg font-semibold mb-4">Jobs Contribution</h3>
            {pieData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '0.5rem', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-slate-300">No job application data available.</div>
            )}
          </div>
        </section>

        <section className="bg-slate-800 rounded-xl shadow-md p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-slate-100">Daily Logs</h3>
            <div className="flex items-center gap-3">
              <label className="text-xs uppercase tracking-wide text-slate-400">Filter by date</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {uniqueDates.map((date) => (
                  <option key={date} value={date}>
                    {date === 'ALL' ? 'All dates' : date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/50 text-xs uppercase tracking-wider text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Day</th>
                  <th className="px-4 py-3 text-left">Topic Learned</th>
                  <th className="px-4 py-3 text-left">What They Learned</th>
                  <th className="px-4 py-3 text-left">Recruiter</th>
                  <th className="px-4 py-3 text-left">Attachment</th>
                  <th className="px-4 py-3 text-center">Jobs</th>
                  <th className="px-4 py-3 text-center">Submissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-sm">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                      {loading ? 'Loading analytics...' : 'No daily logs available.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={`${log.email}-${log.date}-${index}`} className="hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{log.date}</td>
                      <td className="px-4 py-3 break-all">{log.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{log.day || '—'}</td>
                      <td className="px-4 py-3">{log.topic_learned || '—'}</td>
                      <td className="px-4 py-3 whitespace-pre-wrap">{log.what_you_learned || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{log.recruiter_name || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.attachment_url ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(log)}
                              className="text-xs text-indigo-300 hover:text-indigo-100"
                            >
                              Preview
                            </button>
                            <a
                              href={log.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-300 hover:text-slate-100"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{log.jobs_applied}</td>
                      <td className="px-4 py-3 text-center">{log.submissions_done}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={handleClosePreview}>
          <div
            className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">{preview.filename}</h3>
              <button
                onClick={handleClosePreview}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </header>
            <div className="bg-slate-950">
              {preview.isPdf ? (
                <iframe title="Attachment preview" src={preview.url} className="w-full h-[70vh]" />
              ) : (
                <div className="p-6 space-y-4 text-slate-200">
                  <p>This attachment must be downloaded to view.</p>
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
                  >
                    Download {preview.filename}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
