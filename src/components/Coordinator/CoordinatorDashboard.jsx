import React, { useState, useEffect } from 'react';
import Header from '../Layout/Header.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, CheckCircle, AlertTriangle, Download, Eye } from 'lucide-react';
import VerifySubmissions from './VerifySubmissions.jsx';
import StudentCompliance from './StudentCompliance.jsx';
import Reports from './Reports.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    try {
      const response = await fetch(`http://localhost/map-backend/coordinator.php?action=dashboard&id=${user.id || user.username}`);
      const data = await response.json();
      if (data.success) {
        setClassData(data);
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Users },
    { id: 'verify', label: 'Verify Submissions', icon: Clock },
    { id: 'compliance', label: 'Student Compliance', icon: CheckCircle },
    { id: 'reports', label: 'Reports', icon: Download },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Coordinator Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading class data...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = classData?.stats || {};
  const students = classData?.students || [];
  const categoryData = classData?.categoryData || [];
  const pendingSubmissions = classData?.pendingSubmissions || [];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Class Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_students || 0}</p>
              <p className="text-sm text-gray-500">In your class</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending_submissions || 0}</p>
              <p className="text-sm text-gray-500">Awaiting review</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliant Students</p>
              <p className="text-3xl font-bold text-green-600">{stats.compliant_students || 0}</p>
              <p className="text-sm text-gray-500">Meeting requirements</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">At Risk Students</p>
              <p className="text-3xl font-bold text-red-600">{stats.at_risk_students || 0}</p>
              <p className="text-sm text-gray-500">Need attention</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Category-wise Performance</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Average Progress']} />
              <Bar dataKey="average_progress" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
            <p className="text-gray-600 mt-1">Latest activity submissions from your students</p>
          </div>
          {pendingSubmissions.length > 0 && (
            <button
              onClick={() => setActiveTab('verify')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Eye className="h-4 w-4" />
              <span>Review All</span>
            </button>
          )}
        </div>

        {pendingSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending submissions to review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.slice(0, 5).map((submission, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {submission.student_name} - {submission.activity_type}
                  </p>
                  <p className="text-sm text-gray-600">
                    Category {submission.category} • {submission.level} • 
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                  <button
                    onClick={() => setActiveTab('verify')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
            {pendingSubmissions.length > 5 && (
              <div className="text-center pt-3">
                <button
                  onClick={() => setActiveTab('verify')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View {pendingSubmissions.length - 5} more submissions
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Progress Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Student Progress Summary</h2>
            <p className="text-gray-600 mt-1">Overview of student MAP compliance</p>
          </div>
          <button
            onClick={() => setActiveTab('compliance')}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.slice(0, 10).map((student, index) => {
                const progress = student.required_points > 0 ? 
                  (student.earned_points / student.required_points) * 100 : 0;
                const isCompliant = progress >= 100;
                const isAtRisk = progress < 50;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{student.prn}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.earned_points || 0} / {student.required_points || 0}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              isCompliant ? 'bg-green-600' : 
                              isAtRisk ? 'bg-red-600' : 'bg-yellow-600'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isCompliant ? 'bg-green-100 text-green-800' :
                        isAtRisk ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isCompliant ? 'Compliant' : isAtRisk ? 'At Risk' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.last_activity ? 
                        new Date(student.last_activity).toLocaleDateString() : 
                        'No activities'
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Class Coordinator Dashboard" />
      
      <div className="px-6 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'verify' && <VerifySubmissions onUpdate={fetchClassData} />}
          {activeTab === 'compliance' && <StudentCompliance students={students} />}
          {activeTab === 'reports' && <Reports />}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;