import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save } from 'lucide-react';

const ProgramManagement = ({ onUpdate }) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    admission_year: '',
    programme: '',
    duration: '',
    technical: '',
    sports_cultural: '',
    community_outreach: '',
    innovation: '',
    leadership: '',
    total_points: ''
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('http://localhost/map-backend/admin.php?action=get_program_rules');
      const data = await response.json();
      if (data.success) {
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calculate total points
    const total = parseInt(formData.technical || 0) + 
                  parseInt(formData.sports_cultural || 0) + 
                  parseInt(formData.community_outreach || 0) + 
                  parseInt(formData.innovation || 0) + 
                  parseInt(formData.leadership || 0);
    
    const submitData = { ...formData, total_points: total };

    try {
      const response = await fetch('http://localhost/map-backend/admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingProgram ? 'update_program_rule' : 'create_program_rule',
          program_id: editingProgram?.id,
          ...submitData
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingProgram(null);
        setFormData({
          admission_year: '',
          programme: '',
          duration: '',
          technical: '',
          sports_cultural: '',
          community_outreach: '',
          innovation: '',
          leadership: '',
          total_points: ''
        });
        fetchPrograms();
        if (onUpdate) onUpdate();
      } else {
        alert(data.message || 'Error saving program rule');
      }
    } catch (error) {
      console.error('Error saving program rule:', error);
      alert('Error saving program rule');
    }
  };

  const handleDelete = async (programId) => {
    if (!confirm('Are you sure you want to delete this program rule?')) return;

    try {
      const response = await fetch('http://localhost/map-backend/admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_program_rule',
          program_id: programId
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchPrograms();
        if (onUpdate) onUpdate();
      } else {
        alert(data.message || 'Error deleting program rule');
      }
    } catch (error) {
      console.error('Error deleting program rule:', error);
      alert('Error deleting program rule');
    }
  };

  const openModal = (program = null) => {
    setEditingProgram(program);
    if (program) {
      setFormData(program);
    } else {
      setFormData({
        admission_year: '',
        programme: '',
        duration: '',
        technical: '',
        sports_cultural: '',
        community_outreach: '',
        innovation: '',
        leadership: '',
        total_points: ''
      });
    }
    setShowModal(true);
  };

  const calculateTotal = () => {
    return parseInt(formData.technical || 0) + 
           parseInt(formData.sports_cultural || 0) + 
           parseInt(formData.community_outreach || 0) + 
           parseInt(formData.innovation || 0) + 
           parseInt(formData.leadership || 0);
  };

  const programmes = [
    'B.Tech', 'B.Tech (DSY)', 'Integrated B.Tech', 'B.Pharm', 'BCA', 'MCA',
    'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BBA', 'MBA'
  ];

  const admissionYears = [
    '2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Program Rules Management</h2>
            <p className="text-gray-600 mt-1">Define MAP requirements for each program and admission year</p>
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Program Rule</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading program rules...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admission Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Programme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Technical
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sports/Cultural
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Community
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Innovation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leadership
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {programs.map((program, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.admission_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {program.programme}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.duration} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.technical}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.sports_cultural}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.community_outreach}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.innovation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.leadership}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {program.total_points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal(program)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(program.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProgram ? 'Edit Program Rule' : 'Add Program Rule'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admission Year
                  </label>
                  <select
                    value={formData.admission_year}
                    onChange={(e) => setFormData({...formData, admission_year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Year</option>
                    {admissionYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Programme
                  </label>
                  <select
                    value={formData.programme}
                    onChange={(e) => setFormData({...formData, programme: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Programme</option>
                    {programmes.map(prog => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technical Skills (Category A)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.technical}
                    onChange={(e) => setFormData({...formData, technical: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sports & Cultural (Category B)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sports_cultural}
                    onChange={(e) => setFormData({...formData, sports_cultural: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community Outreach (Category C)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.community_outreach}
                    onChange={(e) => setFormData({...formData, community_outreach: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Innovation (Category D)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.innovation}
                    onChange={(e) => setFormData({...formData, innovation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leadership (Category E)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leadership}
                    onChange={(e) => setFormData({...formData, leadership: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Total Points: <span className="text-lg font-bold">{calculateTotal()}</span>
                </p>
              </div>
              
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
                  <span>{editingProgram ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramManagement;