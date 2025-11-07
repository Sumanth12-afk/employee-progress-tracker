import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StudentTable from '../components/StudentTable';
import { adminAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLogs, setStudentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin' && parsedUser.role !== 'super-admin') {
      navigate('/student/dashboard');
      return;
    }
    
    setUser(parsedUser);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, studentsRes, leaderboardRes] = await Promise.all([
        adminAPI.getOverview(),
        adminAPI.getAllStudents(),
        adminAPI.getLeaderboard()
      ]);
      
      setOverview(overviewRes.data.overview);
      setStudents(studentsRes.data.students);
      setLeaderboard(leaderboardRes.data.leaderboard);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentDetails = async (studentId) => {
    try {
      const response = await adminAPI.getStudentLogs(studentId);
      setSelectedStudent(response.data.student);
      setStudentLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching student logs:', error);
    }
  };

  const leaderboardChartData = leaderboard.slice(0, 10).map((student) => ({
    name: student.name.split(' ')[0],
    jobs: student.total_jobs_applied,
    submissions: student.total_submissions
  }));

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
          {user?.role === 'super-admin' && (
            <button
              onClick={() => navigate('/admin/manage-students')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Manage Students
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Active Students</h3>
            <p className="text-3xl font-bold text-blue-600">{overview?.active_students || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Jobs Applied</h3>
            <p className="text-3xl font-bold text-green-600">{overview?.total_jobs_applied || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Total Submissions</h3>
            <p className="text-3xl font-bold text-purple-600">{overview?.total_submissions || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Top 10 Leaderboard</h3>
          {leaderboardChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leaderboardChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="jobs" fill="#3B82F6" name="Jobs Applied" />
                <Bar dataKey="submissions" fill="#10B981" name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No data available</p>
          )}
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">All Students</h3>
          <StudentTable students={students} onViewDetails={handleViewStudentDetails} />
        </div>

        {selectedStudent && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedStudent.name}'s Activity
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jobs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mood</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {studentLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No logs yet</td>
                    </tr>
                  ) : (
                    studentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{log.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{log.jobs_applied}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{log.submissions_done}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{log.mood || '-'}</td>
                        <td className="px-6 py-4 text-sm">{log.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

