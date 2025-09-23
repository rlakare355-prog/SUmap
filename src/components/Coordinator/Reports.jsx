import React, { useState } from 'react';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Reports = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('class-wise');
  const [format, setFormat] = useState('pdf');

  const generateReport = async (type, format) => {
    setGenerating(true);
    try {
      const response = await fetch(`http://localhost/map-backend/reports.php?action=generate&type=${type}&format=${format}&coordinator_id=${user.id || user.username}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report.${format}`;
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
      id: 'class-wise',
      title: 'Class-wise Report',
      description: 'Complete report of all students in your class',
      icon: FileText
    },
    {
      id: 'pending-verifications',
      title: 'Pending Verifications',
      description: 'List of all pending activity verifications',
      icon: Calendar
    },
    {
      id: 'compliance-summary',
      title: 'Compliance Summary',
      description: 'Student compliance status and progress overview',
      icon: Filter
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Generate Reports</h2>
          <p className="text-gray-600 mt-1">Download comprehensive reports for your class</p>
        </div>

        {/* Report Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Report Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            onClick={() => generateReport(reportType, format)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => generateReport('class-wise', 'pdf')}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Download Class Report (PDF)</h4>
              <p className="text-sm text-gray-600">Complete student progress report</p>
            </div>
            <Download className="h-5 w-5 text-gray-400" />
          </button>

          <button
            onClick={() => generateReport('pending-verifications', 'excel')}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Export Pending List (Excel)</h4>
              <p className="text-sm text-gray-600">Activities awaiting verification</p>
            </div>
            <Download className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Report History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No reports generated yet</p>
          <p className="text-sm text-gray-400 mt-1">Generated reports will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;