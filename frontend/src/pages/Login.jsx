import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../utils/firebase';
import { authAPI } from '../services/api';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    if (!token || !rawUser) {
      return;
    }
    try {
      const user = JSON.parse(rawUser);
      if (user.role === 'admin' || user.role === 'super-admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    } catch (parseError) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      const { token } = await signInWithGoogle();
      localStorage.setItem('token', token);

      const response = await authAPI.login(token);
      const userData = response.data;

      localStorage.setItem('user', JSON.stringify(userData));

      if (userData.role === 'admin' || userData.role === 'super-admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to sign in. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-2xl">
        <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500" />
        <div className="relative grid gap-0 md:grid-cols-2">
          <section className="p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
            <div className="space-y-6 text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-indigo-100">
                Before You Solutions
              </span>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white">
                Employee Progress Tracker
              </h1>
              <p className="text-base md:text-lg text-slate-200 max-w-md mx-auto md:mx-0">
                Powered by Before You Solutions to showcase daily wins, streamline outreach, and celebrate top performers across your organisation with real-time dashboards and secure cloud storage.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-indigo-200">Live Team Analytics</p>
                  <p className="mt-2 text-xs text-slate-200">Track totals, submissions, and recruiter touchpoints at a glance.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-purple-200">Secure Attachments</p>
                  <p className="mt-2 text-xs text-slate-200">Upload documents directly to S3 with expiring access links.</p>
                </div>
              </div>
            </div>
            <div className="mt-8 hidden md:flex items-center gap-6 text-sm text-slate-300">
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">3x faster</span>
                <span className="text-xs uppercase tracking-widest text-indigo-200">Reporting cycles</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">Automated</span>
                <span className="text-xs uppercase tracking-widest text-indigo-200">Leaderboard insights</span>
              </div>
            </div>
          </section>

          <section className="p-8 md:p-12 flex flex-col justify-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <img
                src="/before_you_solutions_logo.jpg"
                alt="Before You Solutions logo"
                className="h-32 w-auto drop-shadow-2xl"
              />
              <h2 className="text-2xl font-semibold text-white">Sign in to continue</h2>
              <p className="mt-2 text-sm text-slate-300">Use your active company email to sync your daily contributions.</p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-400 bg-red-500/20 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 text-slate-900 font-semibold shadow-lg shadow-slate-900/20 transition-transform hover:-translate-y-0.5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.1-.8 2.1-1.7 2.7l2.7 2.1c1.6-1.5 2.6-3.7 2.6-6.3 0-.6-.1-1.2-.2-1.8H12z" />
                <path fill="#34A853" d="M6.5 13.1l-.8.6-2.1 1.6C5 18.1 8.2 20.4 12 20.4c2.4 0 4.4-.8 5.8-2.2l-2.7-2.1c-.7.5-1.6.8-3.1.8-2.4 0-4.5-1.6-5.2-3.9z" />
                <path fill="#FBBC05" d="M3.6 7.8C2.9 9.3 2.9 11 3.6 12.5l2.9-2.3c-.3-.8-.3-1.6 0-2.4z" />
                <path fill="#4285F4" d="M12 5.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6C16.4 2.6 14.2 1.6 12 1.6 8.2 1.6 5 3.9 3.6 7.8l2.9 2.3C7.5 7.2 9.6 5.6 12 5.6z" />
              </svg>
              <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <div className="space-y-3 text-xs text-slate-400">
              <p>✅ Track goals, outreach, and reflections from any device.</p>
              <p>✅ Data protected with role-based access and encrypted storage.</p>
              <p>
                ✅ Need help? Contact your program lead or email{' '}
                <a href="mailto:support@bysprogress.com" className="text-indigo-300 hover:text-indigo-100">
                  support@bysprogress.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;

