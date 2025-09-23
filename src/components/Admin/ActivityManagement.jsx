import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Tag } from 'lucide-react';

const ActivityManagement = ({ onUpdate }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('A');
  const [formData, setFormData] = useState({
    category_id: 'A',
    activity_name: '',
    document_evidence: '',
    points_type: 'Level',
    min_points: '',
    max_points: '',
    levels: []
  });

  const categories = [
    { id: 'A', name: 'Technical Skills' },
    { id: 'B', name: 'Sports & Cultural' },
    { id: 'C', name: 'Community Outreach' },
    { id: 'D', name: 'Innovation / IPR' },
    { id: 'E', name: 'Leadership' }
  ];

  const levelOptions = {
    'A': ['College', 'District', 'State', 'National', 'International', 'Department', 'University'],
    'B': ['College', 'District', 'State', 'National', 'International', 'Department', 'University'],
    'C': ['Two Day', 'Up to One Week', 'One Month', 'One Semester/Year'],
    'D': [], // Fixed points only
    'E': ['College', 'District', 'State', 'National', 'International', 'Department', 'University', 'Professional Society']
  };

  const defaultPoints = {
    'A': { 'College': 3, 'District': 6, 'State': 9, 'National': 12, 'International': 15, 'Department': 2, 'University': 4 },
    'B': { 'College': 2, 'District': 4, 'State': 6, 'National': 8, 'International': 10, 'Department': 2, 'University': 4 },
    'C': { 'Two Day': 3, 'Up to One Week': 6, 'One Month': 9, 'One Semester/Year': 12 },
    'E': { 'College': 2, 'District': 4, 'State': 6, 'National': 8, 'International': 10, 'Department': 2, 'University': 4, 'Professional Society': 5 }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedCategory]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost/map-backend/admin.php?action=get_activities&category=${selectedCategory}`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost/map-backend/admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingActivity ? 'update_activity' : 'create_activity',
          activity_id: editingActivity?.id,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingActivity(null);
        resetForm();
        fetchActivities();
        if (onUpdate) onUpdate();
      } else {
        alert(data.message || 'Error saving activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Error saving activity');
    }
  };

  const handleDelete = async (activityId) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const response = await fetch('http://localhost/map-backend/admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_activity',
          activity_id: activityId
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchActivities();
        if (onUpdate) onUpdate();
      } else {
        alert(data.message || 'Error deleting activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Error deleting activity');
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: selectedCategory,
      activity_name: '',
      document_evidence: '',
      points_type: levelOptions[selectedCategory].length > 0 ? 'Level' : 'Fixed',
      min_points: '',
      max_points: '',
      levels: []
    });
  };

  const openModal = (activity = null) => {
    setEditingActivity(activity);
    if (activity) {
      setFormData({
        ...activity,
        levels: activity.levels || []
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handlePointsTypeChange = (type) => {
    const newFormData = { ...formData, points_type: type };
    
    if (type === 'Level' && levelOptions[formData.category_id]) {
      newFormData.levels = levelOptions[formData.category_id].map(level => ({
        level,
        points: defaultPoints[formData.category_id]?.[level] || 5
      }));
      newFormData.min_points = '';
      newFormData.max_points = '';
    } else {
      newFormData.levels = [];
    }
    
    setFormData(newFormData);
  };

  const updateLevelPoints = (levelIndex, points) => {
    const newLevels = [...formData.levels];
    newLevels[levelIndex].points = parseInt(points);
    setFormData({ ...formData, levels: newLevels });
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                resetForm();
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag className="h-4 w-4" />
              <span>Category {category.id} - {category.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Category {selectedCategory} Activities
            </h2>
            <p className="text-gray-600 mt-1">
              Manage activities for {categories.find(c => c.id === selectedCategory)?.name}
            </p>
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Activity</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading activities...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{activity.activity_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Evidence Required:</span> {activity.document_evidence}
                    </p>
                    <div className="mt-2">
                      {activity.points_type === 'Fixed' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Fixed: {activity.min_points} points
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {activity.levels?.map((level, levelIndex) => (
                            <span
                              key={levelIndex}
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                            >
                              {level.level}: {level.points}pts
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openModal(activity)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                <p className="text-gray-600">Add activities for Category {selectedCategory}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingActivity ? 'Edit Activity' : 'Add Activity'} - Category {formData.category_id}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Name
                </label>
                <input
                  type="text"
                  value={formData.activity_name}
                  onChange={(e) => setFormData({...formData, activity_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Evidence Required
                </label>
                <input
                  type="text"
                  value={formData.document_evidence}
                  onChange={(e) => setFormData({...formData, document_evidence: e.target.value})}
                  placeholder="e.g., Certificate, Report, Proof"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Type
                </label>
                <div className="flex space-x-4">
                  {levelOptions[formData.category_id].length > 0 && (
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="points_type"
                        value="Level"
                        checked={formData.points_type === 'Level'}
                        onChange={(e) => handlePointsTypeChange(e.target.value)}
                        className="mr-2"
                      />
                      Level-based Points
                    </label>
                  )}
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="points_type"
                      value="Fixed"
                      checked={formData.points_type === 'Fixed'}
                      onChange={(e) => handlePointsTypeChange(e.target.value)}
                      className="mr-2"
                    />
                    Fixed Points
                  </label>
                </div>
              </div>

              {formData.points_type === 'Fixed' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.min_points}
                      onChange={(e) => setFormData({...formData, min_points: e.target.value, max_points: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level-wise Points
                  </label>
                  <div className="space-y-2">
                    {formData.levels.map((level, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="w-32 text-sm font-medium text-gray-700">
                          {level.level}:
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={level.points}
                          onChange={(e) => updateLevelPoints(index, e.target.value)}
                          className="w-20 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <span className="text-sm text-gray-500">points</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingActivity ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityManagement;