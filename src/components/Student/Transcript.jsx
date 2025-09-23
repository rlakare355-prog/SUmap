import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Transcript = () => {
  const { user } = useAuth();
  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranscriptData();
  }, []);

  const fetchTranscriptData = async () => {
    try {
      const response = await fetch(`http://localhost/map-backend/transcript.php?action=get&prn=${user.prn || user.username}`);
      const data = await response.json();
      if (data.success) {
        setTranscriptData(data.transcript);
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTranscript = async () => {
    try {
      const response = await fetch(`http://localhost/map-backend/transcript.php?action=download&prn=${user.prn || user.username}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MAP_Transcript_${user.prn || user.username}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error downloading transcript');
      }
    } catch (error) {
      console.error('Error downloading transcript:', error);
      alert('Error downloading transcript');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (!transcriptData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transcript data available</h3>
          <p className="text-gray-600">Complete some activities to generate your transcript</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">MAP Transcript</h2>
            <p className="text-gray-600 mt-1">Personal transcript of MAP activities and achievements</p>
          </div>
          <button
            onClick={downloadTranscript}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Student Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">PRN</p>
            <p className="text-gray-900">{transcriptData.student.prn}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Name</p>
            <p className="text-gray-900">
              {transcriptData.student.first_name} {transcriptData.student.middle_name} {transcriptData.student.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Programme</p>
            <p className="text-gray-900">{transcriptData.student.programme}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Department</p>
            <p className="text-gray-900">{transcriptData.student.dept}</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">MAP Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{transcriptData.summary.total_earned}</p>
            <p className="text-sm text-gray-600">Total Points Earned</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{transcriptData.summary.total_activities}</p>
            <p className="text-sm text-gray-600">Activities Completed</p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {((transcriptData.summary.total_earned / transcriptData.summary.total_required) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Progress</p>
          </div>
        </div>
      </div>

      {/* Category-wise Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category-wise Performance</h3>
        <div className="space-y-4">
          {transcriptData.categories.map((category, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">Category {category.category} - {category.name}</h4>
                <span className="text-sm font-medium text-blue-600">
                  {category.earned} / {category.required} points
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min((category.earned / category.required) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((category.earned / category.required) * 100).toFixed(1)}% complete
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Activities Detail */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transcriptData.activities.map((activity, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.activity_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(activity.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {activity.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      activity.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      activity.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transcript;