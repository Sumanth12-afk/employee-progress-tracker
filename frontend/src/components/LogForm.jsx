import { useRef, useState } from 'react';

const initialState = {
  day: '',
  topic_learned: '',
  jobs_applied: 0,
  submissions_done: 0,
  what_you_learned: '',
  recruiter_name: ''
};

const ALLOWED_EXTENSIONS = ['pdf', 'docx'];

const LogForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState(initialState);
  const [attachment, setAttachment] = useState(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'jobs_applied' || name === 'submissions_done' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAttachment(null);
      setFileError('');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setAttachment(null);
      setFileError('Only PDF or DOCX files can be uploaded.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setAttachment(file);
    setFileError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!attachment) {
      setFileError('Please attach your daily PDF or DOCX progress document.');
      return;
    }

    const succeeded = await onSubmit(formData, attachment);
    if (succeeded) {
      setFormData(initialState);
      setAttachment(null);
      setFileError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-200">Current Day</label>
          <input
            type="text"
            name="day"
            value={formData.day}
            onChange={handleChange}
            placeholder="Day-1"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-200">Topic Learned</label>
          <input
            type="text"
            name="topic_learned"
            value={formData.topic_learned}
            onChange={handleChange}
            placeholder="AWS IAM Basics"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-200">Recruiter Name</label>
        <input
          type="text"
          name="recruiter_name"
          value={formData.recruiter_name}
          onChange={handleChange}
          placeholder="Recruiter or company contact"
          className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
          required
        />
        <span className="text-xs text-slate-400">Helps managers understand your outreach pipeline.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-200">Jobs Applied</label>
          <input
            type="number"
            name="jobs_applied"
            value={formData.jobs_applied}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-200">Submissions Done</label>
          <input
            type="number"
            name="submissions_done"
            value={formData.submissions_done}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-200">What You Learned</label>
        <textarea
          name="what_you_learned"
          value={formData.what_you_learned}
          onChange={handleChange}
          rows="4"
          placeholder="Summarize your learning for the day"
          className="w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-100"
          required
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-200">Attach Daily Progress Document (PDF or DOCX)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          required
          className="w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-500/20 file:text-indigo-200 hover:file:bg-indigo-500/30"
        />
        <div className="text-xs text-slate-300 leading-relaxed space-y-1">
          <p>Attach the daily template that includes:</p>
          <p>• Companies you applied to today with recruiter contact details.</p>
          <p>• Progress updates compared to yesterday (what moved forward, what is pending).</p>
          <p>• Planned next steps or follow ups for tomorrow.</p>
          <p className="text-slate-400">Template will be shared in the group—fill it out and upload as a PDF or DOCX each day.</p>
          {fileError && <p className="text-red-300 font-medium">{fileError}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-medium py-3 rounded-lg transition-transform transform hover:-translate-y-0.5"
      >
        Submit Log
      </button>
    </form>
  );
};

export default LogForm;
