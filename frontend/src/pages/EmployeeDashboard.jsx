import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LogForm from '../components/LogForm';
import { logsAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const EmployeeDashboard = () => {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/');
      return;
    }
    const parsed = JSON.parse(stored);
    setUser(parsed);
    fetchLogs();
  }, [navigate]);

  useEffect(() => {
    if (!status.message) return;
    const id = setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    return () => clearTimeout(id);
  }, [status.message]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await logsAPI.getMyLogs();
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs', error);
      setStatus({ type: 'error', message: 'Unable to load your logs. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const recruiterSuggestions = useMemo(() => {
    const unique = new Set((logs || []).map((log) => log.recruiter_name).filter(Boolean));
    return Array.from(unique).slice(0, 6);
  }, [logs]);

  const handleSubmitLog = async (formData, attachment) => {
    if (!user?.email) {
      setStatus({ type: 'error', message: 'User email missing. Please sign in again.' });
      return false;
    }

    try {
      setStatus({ type: 'pending', message: 'Submitting log...' });
      await logsAPI.createLog(
        {
          email: user.email,
          day: formData.day,
          topic_learned: formData.topic_learned,
          jobs_applied: formData.jobs_applied,
          submissions_done: formData.submissions_done,
          what_you_learned: formData.what_you_learned,
          recruiter_name: formData.recruiter_name
        },
        attachment
      );
      setStatus({ type: 'success', message: 'Log submitted successfully!' });
      fetchLogs();
      return true;
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg).join(', ')
        : detail || 'Error submitting log';
      setStatus({ type: 'error', message });
      return false;
    }
  };

  const handleOpenPreview = (log) => {
    if (!log?.attachment_url) return;
    setPreview({
      url: log.attachment_url,
      filename: log.attachment_filename || 'attachment',
      isPdf: (log.attachment_filename || '').toLowerCase().endsWith('.pdf')
    });
  };

  const handleClosePreview = () => setPreview(null);

  const chartData = useMemo(() => {
    if (!logs.length) return [];
    return [...logs]
      .reverse()
      .map((log) => ({
        date: log.date,
        jobs: Number(log.jobs_applied) || 0,
        submissions: Number(log.submissions_done) || 0
      }));
  }, [logs]);

  const groupedLogs = useMemo(() => {
    const groups = logs.reduce((acc, log) => {
      const key = log.date || 'Unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});
    return Object.entries(groups)
      .map(([date, entries]) => ({ date, entries: entries.sort((a, b) => (b.day || '').localeCompare(a.day || '')) }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const totalJobs = logs.reduce((sum, log) => sum + (Number(log.jobs_applied) || 0), 0);
  const totalSubmissions = logs.reduce((sum, log) => sum + (Number(log.submissions_done) || 0), 0);
  const totalRecruiters = recruiterSuggestions.length;

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const statusColor =
    status.type === 'success'
      ? 'bg-emerald-100 text-emerald-700'
      : status.type === 'error'
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <header className="bg-slate-900/70 backdrop-blur rounded-2xl border border-slate-800 px-6 py-6 flex flex-col gap-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Welcome back</p>
              <h1 className="text-3xl font-semibold text-white">{user.name}</h1>
            </div>
            {status.message && (
              <div className={`px-4 py-2 rounded-md text-sm font-medium ${statusColor}`}>
                {status.message}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Jobs Applied</p>
              <p className="text-2xl font-semibold text-indigo-400 mt-1">{totalJobs}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Submissions</p>
              <p className="text-2xl font-semibold text-emerald-400 mt-1">{totalSubmissions}</p>
            </div>
            <div className="bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-400">Recruiters Contacted</p>
              <p className="text-2xl font-semibold text-amber-400 mt-1">{totalRecruiters}</p>
            </div>
          </div>
        </header>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Daily Log</h2>
            <p className="text-sm text-slate-400">Share today’s focus, applications, and outreach to keep your leads aligned.</p>
          </div>
          {recruiterSuggestions.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300">
              <p className="mb-2 font-medium text-slate-200">Recently used recruiters:</p>
              <div className="flex flex-wrap gap-2">
                {recruiterSuggestions.map((name) => (
                  <span key={name} className="px-3 py-1 rounded-full bg-slate-700/70 text-xs uppercase tracking-wide">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <LogForm onSubmit={handleSubmitLog} />
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Last 30 Days Activity</h2>
            {chartData.length > 0 && (
              <span className="text-xs text-slate-400">{chartData.length} entries visualized</span>
            )}
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="submissionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '0.75rem', border: 'none', color: '#E2E8F0' }} />
                <Area type="monotone" dataKey="jobs" stroke="#6366F1" fill="url(#jobsGradient)" name="Jobs" />
                <Area type="monotone" dataKey="submissions" stroke="#22C55E" fill="url(#submissionsGradient)" name="Submissions" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">No data to display yet. Submit your first log to see progress.</p>
          )}
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Daily Reflections</h2>
          {loading ? (
            <div className="text-sm text-slate-400">Loading...</div>
          ) : groupedLogs.length === 0 ? (
            <div className="text-sm text-slate-400">No logs submitted yet.</div>
          ) : (
            <div className="space-y-4">
              {groupedLogs.map(({ date, entries }) => (
                <details key={date} className="group bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <summary className="cursor-pointer px-4 py-3 flex items-center justify-between text-sm font-medium text-slate-200">
                    <span>{date}</span>
                    <span className="text-xs text-slate-400">{entries.length} reflection{entries.length > 1 ? 's' : ''}</span>
                  </summary>
                  <div className="px-4 pb-4 space-y-4">
                    {entries.map((log, idx) => (
                      <div key={`${log.date}-${idx}`} className="bg-slate-900/70 border border-slate-800 rounded-lg px-4 py-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 uppercase tracking-wide">
                          <span>{log.day || 'Day ?'}</span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200">
                            Recruiter: {log.recruiter_name || 'N/A'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
                            Jobs: {log.jobs_applied}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-200">
                            Submissions: {log.submissions_done}
                          </span>
                  {log.attachment_url && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(log)}
                        className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-100 hover:bg-blue-500/40"
                      >
                        Preview
                      </button>
                      <a
                        href={log.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-200 hover:bg-slate-500/30"
                      >
                        Download
                      </a>
                    </div>
                  )}
                        </div>
                        <h3 className="text-slate-200 font-semibold text-sm">Topic: {log.topic_learned || '—'}</h3>
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{log.what_you_learned || 'No reflection provided.'}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
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
                <iframe
                  title="Attachment preview"
                  src={preview.url}
                  className="w-full h-[70vh]"
                />
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

export default EmployeeDashboard;

