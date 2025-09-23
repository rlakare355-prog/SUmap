import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye, Download, Calendar, Tag, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const VerifySubmissions = ({ onUpdate }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      const response = await fetch(`http://localhost/map-backend/coordinator.php?action=pending_submissions&id=${user.id || user.username}`);
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

  const handleVerification = async (submissionId, action, points = 0, remarks = '') => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost/map-backend/coordinator.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_submission',
          submission_id: submissionId,
          verification_action: action,
          points,
          remarks,
          coordinator_id: user.id || user.username
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchPendingSubmissions();
        setSelectedSubmission(null);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error verifying submission:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true;
    return submission.category === filter;
  });

  const VerificationModal = ({ submission, onClose }) => {
    const [action, setAction] = useState('');
    const [points, setPoints] = useState(0);
    const [remarks, setRemarks] = useState('');

    const getMaxPoints = (category, level) => {
      const pointsMap = {
        'A': { 'College': 3, 'District': 6, 'State': 9, 'National': 12, 'International': 15, 'Department': 2, 'University': 4 },
        'B': { 'College': 2, 'District': 4, 'State': 6, 'National': 8, 'International': 10, 'Department': 2, 'University': 4 },
        'C': { 'Two Day': 3, 'Up to One Week': 6, 'One Month': 9, 'One Semester/Year': 12 },
        'D': { 'Workshop': 5, 'MSME Programme': 5, 'Awards/Recognition': 10, 'Prototype': 15, 'Patent Filed': 5, 'Patent Published': 10, 'Patent Granted': 15 },
        'E': { 'College': 2, 'District': 4, 'State': 6, 'National': 8, 'International': 10, 'Department': 2, 'University': 4, 'Professional Society': 5 }
      };
      return pointsMap[category]?.[level] || 5;
    };

    const maxPoints = getMaxPoints(submission.category, submission.level);

    useEffect(() => {
      if (action === 'approve') {
        setPoints(maxPoints);
      }
    }, [action, maxPoints]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Verify Submission</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Submission Details */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Submission Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Student:</span> {submission.student_name} ({submission.prn})</div>
                    <div><span className="font-medium">Activity:</span> {submission.activity_type}</div>
                    <div><span className="font-medium">Category:</span> {submission.category}</div>
                    <div><span className="font-medium">Level:</span> {submission.level}</div>
                    <div><span className="font-medium">Date:</span> {formatDate(submission.date)}</div>
                    {submission.remarks && (
                      <div><span className="font-medium">Student Remarks:</span> {submission.remarks}</div>
                    )}
                  </div>
                </div>

                {/* Certificate Preview */}
                {submission.certificate && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Certificate</h4>
                    <button
                      onClick={() => window.open(`http://localhost/map-backend/uploads/${submission.certificate}`, '_blank')}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                    >
                      <Download className="h-4 w-4" />
                      <span>View Certificate</span>
                    </button>
                  </div>
                )}

                {/* Proof Preview */}
                {submission.proof && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Additional Proof</h4>
                    <button
                      onClick={() => window.open(`http://localhost/map-backend/uploads/${submission.proof}`, '_blank')}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                    >
                      <Download className="h-4 w-4" />
                      <span>View Proof</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Verification Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Decision
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="approve"
                        onChange={(e) => setAction(e.target.value)}
                        className="mr-2"
                      />
                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      Approve
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="reject"
                        onChange={(e) => setAction(e.target.value)}
                        className="mr-2"
                      />
                      <XCircle className="h-4 w-4 text-red-600 mr-1" />
                      Reject
                    </label>
                  </div>
                </div>

                {action === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points to Award (Max: {maxPoints})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxPoints}
                      value={points}
                      onChange={(e) => setPoints(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add your feedback..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleVerification(submission.id, action, points, remarks)}
                    disabled={!action || actionLoading}
                    className={`px-4 py-2 text-white rounded-lg font-medium ${
                      action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {actionLoading ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Verify Submissions</h2>
            <p className="text-gray-600 mt-1">Review and verify student MAP activities</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="A">Technical Skills</option>
              <option value="B">Sports & Cultural</option>
              <option value="C">Community Outreach</option>
              <option value="D">Innovation</option>
              <option value="E">Leadership</option>
            </select>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions to review</h3>
            <p className="text-gray-600">All submissions have been processed</p>
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
                      <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{submission.student_name || `Student ${submission.prn}`}</h3>
                        <p className="text-sm text-gray-500">{submission.prn}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 ml-13">
                      <div className="flex items-center space-x-1">
                        <Tag className="h-4 w-4" />
                        <span>{submission.activity_type}</span>
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {submission.category}
                      </div>
                      <div>
                        <span className="font-medium">Level:</span> {submission.level}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(submission.date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Review</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSubmission && (
        <VerificationModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};

export default VerifySubmissions;