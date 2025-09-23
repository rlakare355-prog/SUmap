import React, { useState } from 'react';
import { Download, FileText, Calendar, Filter, BarChart } from 'lucide-react';

const Reports = () => {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('university-wide');
  const [format, setFormat] = useState('pdf');
  const [filters, setFilters] = useState({
    department: '',
    programme: '',
    year: '',
    admission_year: ''
  });

  const generateReport = async (type, format, reportFilters = {}) => {
    setGenerating(true);
    try {
      const queryParams = new URLSearchParams({
        action: 'generate_report',
        type,
        format,
        ...reportFilters
      });

      const response = await fetch(`http://localhost/map-backend/admin.php?${queryParams}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error generating report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  const reportTypes = [
    {
      id: 'university-wide',
      title: 'University-wide Report',
      description: 'Complete overview of all departments and programs',
      icon: BarChart
    },
    {
      id: 'department-wise',
      title: 'Department-wise Report',
      description: 'Detailed report for specific department',
      icon: FileText
    },
    {
      id: 'programme-wise',
      title: 'Programme-wise Report',
      description: 'Report filtered by specific programme',
      icon: Calendar
    },
    {
      id: 'compliance-summary',
      title: 'Compliance Summary',
      description: 'Student compliance status across university',
      icon: Filter
    }
  ];

  const departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Telecommunication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Pharmacy',
    'Management Studies',
    'Commerce',
    'Science'
  ];

  const programmes = [
    'B.Tech', 'B.Tech (DSY)', 'Integrated B.Tech', 'B.Pharm', 'BCA', 'MCA',
    'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BBA', 'MBA'
  ];

  const years = ['1', '2', '3', '4', '5', '6'];
  const admissionYears = ['2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Generate Reports</h2>
          <p className="text-gray-600 mt-1">Download comprehensive reports for university-wide analysis</p>
        </div>

        {/* Report Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Report Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    reportType === type.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <h3 className="font-medium">{type.title}</h3>
                  <p className="text-sm opacity-75">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        {(reportType === 'department-wise' || reportType === 'programme-wise') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Report Filters
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {reportType === 'department-wise' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({...filters, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {reportType === 'programme-wise' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Programme</label>
                  <select
                    value={filters.programme}
                    onChange={(e) => setFilters({...filters, programme: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Programmes</option>
                    {programmes.map(prog => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Admission Year</label>
                <select
                  value={filters.admission_year}
                  onChange={(e) => setFilters({...filters, admission_year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Admission Years</option>
                  {admissionYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Format
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setFormat('pdf')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                format === 'pdf'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              PDF
            </button>
            <button
              onClick={() => setFormat('excel')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                format === 'excel'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Excel
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            onClick={() => generateReport(reportType, format, filters)}
            disabled={generating}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>{generating ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => generateReport('university-wide', 'pdf')}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-left">
              <h4 className="font-medium text-gray-900">University Report (PDF)</h4>
              <p className="text-sm text-gray-600">Complete university overview</p>
            </div>
            <Download className="h-5 w-5 text-gray-400" />
          </button>

          <button
            onClick={() => generateReport('compliance-summary', 'excel')}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Compliance Summary (Excel)</h4>
              <p className="text-sm text-gray-600">Student compliance data</p>
            </div>
            <Download className="h-5 w-5 text-gray-400" />
          </button>

          <button
            onClick={() => generateReport('department-wise', 'pdf')}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Department Analysis (PDF)</h4>
              <p className="text-sm text-gray-600">Department-wise breakdown</p>
            </div>
            <Download className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Report Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">24</p>
            <p className="text-sm text-gray-600">Reports Generated Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">156</p>
            <p className="text-sm text-gray-600">Reports This Month</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">89%</p>
            <p className="text-sm text-gray-600">University Compliance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">12</p>
            <p className="text-sm text-gray-600">Departments Tracked</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;