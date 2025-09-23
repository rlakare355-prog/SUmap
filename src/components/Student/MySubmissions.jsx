import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye, Download, Calendar, Tag, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const MySubmissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`http://localhost/map-backend/student.php?action=my_submissions&prn=${user.prn || user.username}`);
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true;
    return submission.status.toLowerCase() === filter;
  });

  const SubmissionModal = ({ submission, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Submission Details</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Activity Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Activity:</span> {submission.activity_type}</div>
                <div><span className="font-medium">Category:</span> {submission.category}</div>
                <div><span className="font-medium">Level:</span> {submission.level}</div>
                <div><span className="font-medium">Date:</span> {formatDate(submission.date)}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
                {submission.points > 0 && (
                  <div><span className="font-medium">Points Awarded:</span> 
                    <span className="ml-2 font-bold text-green-600">{submission.points}</span>
                  </div>
                )}
              </div>
            </div>

            {submission.remarks && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Your Remarks</h4>
                <p className="text-sm text-gray-700">{submission.remarks}</p>
              </div>
            )}

            {submission.coordinator_remarks && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Coordinator Feedback</h4>
                <p className="text-sm text-gray-700">{submission.coordinator_remarks}</p>
              </div>
            )}

            <div className="flex space-x-4">
              {submission.certificate && (
                <button
                  onClick={() => window.open(`http://localhost/map-backend/uploads/${submission.certificate}`, '_blank')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <Download className="h-4 w-4" />
                  <span>View Certificate</span>
                </button>
              )}
              {submission.proof && (
                <button
                  onClick={() => window.open(`http://localhost/map-backend/uploads/${submission.proof}`, '_blank')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                >
                  <Download className="h-4 w-4" />
                  <span>View Proof</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Submissions</h2>
            <p className="text-gray-600 mt-1">Track the status of your MAP activity submissions</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Submissions</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">
              {filter === 'all' ? 
                'You haven\'t submitted any activities yet' : 
                `No ${filter} submissions found`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(submission.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{submission.activity_type}</h3>
                        <p className="text-sm text-gray-500">Submitted on {formatDate(submission.submitted_at)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 ml-8">
                      <div className="flex items-center space-x-1">
                        <Tag className="h-4 w-4" />
                        <span>Category {submission.category}</span>
                      </div>
                      <div>
                        <span className="font-medium">Level:</span> {submission.level}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(submission.date)}</span>
                      </div>
                      {submission.points > 0 && (
                        <div>
                          <span className="font-medium text-green-600">+{submission.points} points</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>

                {submission.coordinator_remarks && (
                  <div className="mt-3 ml-8 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Coordinator Feedback</span>
                    </div>
                    <p className="text-sm text-yellow-700">{submission.coordinator_remarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSubmission && (
        <SubmissionModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};

export default MySubmissions;