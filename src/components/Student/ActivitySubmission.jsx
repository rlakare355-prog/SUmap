import React, { useState, useEffect } from 'react';
import { Upload, FileText, Calendar, Tag, MapPin, Camera, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const ActivitySubmission = ({ onUpdate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    category: '',
    activity_type: '',
    level: '',
    date: '',
    remarks: '',
    certificate: null,
    proof: null,
    proof_type: ''
  });
  const [activities, setActivities] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const categories = [
    { id: 'A', name: 'Technical Skills', description: 'Paper presentations, hackathons, workshops, certifications' },
    { id: 'B', name: 'Sports & Cultural', description: 'Sports competitions, cultural events, performances' },
    { id: 'C', name: 'Community Outreach', description: 'Social service, community initiatives, volunteering' },
    { id: 'D', name: 'Innovation / IPR', description: 'Patents, startups, research, entrepreneurship' },
    { id: 'E', name: 'Leadership', description: 'Club activities, leadership roles, management positions' }
  ];

  const proofTypes = [
    { id: 'geotag', name: 'Geotagged Photo', description: 'Photo with location information' },
    { id: 'event_image', name: 'Event Image', description: 'Photo from the event/activity' },
    { id: 'group_image', name: 'Group Photo', description: 'Photo with participants/team members' }
  ];

  useEffect(() => {
    if (formData.category) {
      fetchActivities(formData.category);
    }
  }, [formData.category]);

  useEffect(() => {
    if (formData.activity_type) {
      fetchLevels(formData.activity_type);
    }
  }, [formData.activity_type]);

  const fetchActivities = async (category) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost/map-backend/activities.php?action=get_by_category&category=${category}`);
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async (activityId) => {
    try {
      const response = await fetch(`http://localhost/map-backend/activities.php?action=get_levels&activity_id=${activityId}`);
      const data = await response.json();
      if (data.success) {
        setLevels(data.levels);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const submitData = new FormData();
    submitData.append('action', 'submit_activity');
    submitData.append('prn', user.prn || user.username);
    submitData.append('category', formData.category);
    submitData.append('activity_type', formData.activity_type);
    submitData.append('level', formData.level);
    submitData.append('date', formData.date);
    submitData.append('remarks', formData.remarks);
    submitData.append('proof_type', formData.proof_type);
    
    if (formData.certificate) {
      submitData.append('certificate', formData.certificate);
    }
    if (formData.proof) {
      submitData.append('proof', formData.proof);
    }

    try {
      const response = await fetch('http://localhost/map-backend/student.php', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();
      if (data.success) {
        alert('Activity submitted successfully!');
        setFormData({
          category: '',
          activity_type: '',
          level: '',
          date: '',
          remarks: '',
          certificate: null,
          proof: null,
          proof_type: ''
        });
        setActivities([]);
        setLevels([]);
        if (onUpdate) onUpdate();
      } else {
        alert(data.message || 'Error submitting activity');
      }
    } catch (error) {
      console.error('Error submitting activity:', error);
      alert('Error submitting activity');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Submit MAP Activity</h2>
          <p className="text-gray-600 mt-1">Submit your activities for MAP credit verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Category *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: category.id, activity_type: '', level: '' }))}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    formData.category === category.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Tag className="h-5 w-5 mr-2" />
                    <span className="font-medium">Category {category.id}</span>
                  </div>
                  <h3 className="font-medium mb-1">{category.name}</h3>
                  <p className="text-sm opacity-75">{category.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Type */}
          {formData.category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Activity Type *
              </label>
              <select
                name="activity_type"
                value={formData.activity_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose an activity...</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.activity_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Level Selection */}
          {formData.activity_type && levels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Level *
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose level...</option>
                {levels.map((level, index) => (
                  <option key={index} value={level.level}>
                    {level.level} ({level.points} points)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Certificate Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate/Document *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Upload certificate or supporting document</p>
              <input
                type="file"
                name="certificate"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="certificate-upload"
                required
              />
              <label
                htmlFor="certificate-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </label>
              {formData.certificate && (
                <p className="text-sm text-green-600 mt-2">{formData.certificate.name}</p>
              )}
            </div>
          </div>

          {/* Proof Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Additional Proof Type * (Select one)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {proofTypes.map((type) => {
                const Icon = type.id === 'geotag' ? MapPin : type.id === 'event_image' ? Camera : Users;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, proof_type: type.id }))}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      formData.proof_type === type.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Icon className="h-6 w-6 mb-2" />
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm opacity-75">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Proof Upload */}
          {formData.proof_type && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload {proofTypes.find(p => p.id === formData.proof_type)?.name} *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload {proofTypes.find(p => p.id === formData.proof_type)?.name.toLowerCase()}
                </p>
                <input
                  type="file"
                  name="proof"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  id="proof-upload"
                  required
                />
                <label
                  htmlFor="proof-upload"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </label>
                {formData.proof && (
                  <p className="text-sm text-green-600 mt-2">{formData.proof.name}</p>
                )}
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional information about your activity..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? 'Submitting...' : 'Submit Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivitySubmission;