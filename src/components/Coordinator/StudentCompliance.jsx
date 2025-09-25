import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, TrendingUp, Download } from 'lucide-react';

const StudentCompliance = ({ students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('all');

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prn?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const progress = student.required_points > 0 ? 
      (student.earned_points / student.required_points) * 100 : 0;
    
    const matchesFilter = complianceFilter === 'all' ||
      (complianceFilter === 'compliant' && progress >= 100) ||
      (complianceFilter === 'in-progress' && progress >= 50 && progress < 100) ||
      (complianceFilter === 'at-risk' && progress < 50);

    return matchesSearch && matchesFilter;
  });

  const getComplianceStats = () => {
    const compliant = students.filter(s => {
      const progress = s.required_points > 0 ? (s.earned_points / s.required_points) * 100 : 0;
      return progress >= 100;
    }).length;
    
    const inProgress = students.filter(s => {
      const progress = s.required_points > 0 ? (s.earned_points / s.required_points) * 100 : 0;
      return progress >= 50 && progress < 100;
    }).length;
    
    const atRisk = students.filter(s => {
      const progress = s.required_points > 0 ? (s.earned_points / s.required_points) * 100 : 0;
      return progress < 50;
    }).length;

    return { compliant, inProgress, atRisk };
  };

  const stats = getComplianceStats();

  const exportReport = () => {
    const csvContent = [
      ['PRN', 'Name', 'Program', 'Earned Points', 'Required Points', 'Progress %', 'Status'].join(','),
      ...filteredStudents.map(student => {
        const progress = student.required_points > 0 ? 
          (student.earned_points / student.required_points) * 100 : 0;
        const status = progress >= 100 ? 'Compliant' : 
                      progress >= 50 ? 'In Progress' : 'At Risk';
        return [
          student.prn,
          `"${student.first_name} ${student.last_name}"`,
          student.programme,
          student.earned_points || 0,
          student.required_points || 0,
          progress.toFixed(1) + '%',
          status
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_compliance_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliant Students</p>
              <p className="text-3xl font-bold text-green-600">{stats.compliant}</p>
              <p className="text-sm text-gray-500">
                {students.length > 0 ? ((stats.compliant / students.length) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">
                {students.length > 0 ? ((stats.inProgress / students.length) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">At Risk</p>
              <p className="text-3xl font-bold text-red-600">{stats.atRisk}</p>
              <p className="text-sm text-gray-500">
                {students.length > 0 ? ((stats.atRisk / students.length) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Student Compliance Tracking</h2>
            <p className="text-gray-600 mt-1">Monitor student progress towards MAP requirements</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Students</option>
              <option value="compliant">Compliant</option>
              <option value="in-progress">In Progress</option>
              <option value="at-risk">At Risk</option>
            </select>
            
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View Certificates
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student, index) => {
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
                        <p className="text-sm text-gray-900">{student.programme}</p>
                        <p className="text-sm text-gray-500">Year {student.year}</p>
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
                        <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}%</p>
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
                      <button
                        onClick={() => viewStudentCertificates(student.prn)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Student Certificates Modal */}
      {selectedStudent && (
        <StudentCertificatesModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

// Add state for selected student
const [selectedStudent, setSelectedStudent] = useState(null);

// Add function to view student certificates
const viewStudentCertificates = async (prn) => {
  try {
    const response = await fetch(`http://localhost/map-backend/coordinator.php?action=get_student_certificates&prn=${prn}`);
    const data = await response.json();
    if (data.success) {
      setSelectedStudent({
        prn,
        certificates: data.certificates,
        student_info: data.student_info
      });
    }
  } catch (error) {
    console.error('Error fetching student certificates:', error);
  }
};

// Student Certificates Modal Component
const StudentCertificatesModal = ({ student, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Certificates - {student.student_info?.first_name} {student.student_info?.last_name} ({student.prn})
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {student.certificates && student.certificates.length > 0 ? (
            <div className="space-y-4">
              {student.certificates.map((cert, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{cert.activity_type}</h4>
                      <p className="text-sm text-gray-600">Category {cert.category} • {cert.level}</p>
                      <p className="text-sm text-gray-500">Date: {new Date(cert.date).toLocaleDateString()}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                        cert.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        cert.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cert.status}
                      </span>
                      {cert.status === 'Approved' && (
                        <span className="ml-2 text-sm font-medium text-green-600">
                          +{cert.points} points
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      {cert.certificate && (
                        <button
                          onClick={() => window.open(`http://localhost/map-backend/uploads/${cert.certificate}`, '_blank')}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                        >
                          <Download className="h-4 w-4" />
                          <span>Certificate</span>
                        </button>
                      )}
                      {cert.proof && (
                        <button
                          onClick={() => window.open(`http://localhost/map-backend/uploads/${cert.proof}`, '_blank')}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                        >
                          <Download className="h-4 w-4" />
                          <span>Proof</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {cert.remarks && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800"><strong>Student Remarks:</strong> {cert.remarks}</p>
                    </div>
                  )}
                  
                  {cert.coordinator_remarks && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800"><strong>Coordinator Feedback:</strong> {cert.coordinator_remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
              <p className="text-gray-600">This student hasn't submitted any activities yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default StudentCompliance;