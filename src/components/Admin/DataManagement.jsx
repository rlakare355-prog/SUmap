import React, { useState } from 'react';
import { Download, Upload, Database, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const DataManagement = () => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const createBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch('http://localhost/map-backend/admin.php?action=create_backup', {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `map_backup_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error creating backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileImport = async (type) => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('action', 'import_data');
    formData.append('import_type', type);
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost/map-backend/admin.php', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully imported ${data.imported_count} records`);
        setSelectedFile(null);
      } else {
        alert(data.message || 'Error importing data');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data');
    } finally {
      setImportLoading(false);
    }
  };

  const exportData = async (type) => {
    try {
      const response = await fetch(`http://localhost/map-backend/admin.php?action=export_data&type=${type}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error exporting data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  const dataTypes = [
    { id: 'students', label: 'Students', description: 'Student records and information' },
    { id: 'activities', label: 'Activities', description: 'Student activity submissions' },
    { id: 'users', label: 'Users', description: 'System users (coordinators, HoDs, admins)' },
    { id: 'program_rules', label: 'Program Rules', description: 'MAP requirements by program' }
  ];

  return (
    <div className="space-y-6">
      {/* Database Backup */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Database Backup</h2>
            <p className="text-gray-600 mt-1">Create and manage database backups</p>
          </div>
          <Database className="h-8 w-8 text-blue-600" />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              Regular backups are essential for data security. Create backups before major system changes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={createBackup}
            disabled={backupLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{backupLoading ? 'Creating Backup...' : 'Create Database Backup'}</span>
          </button>
          
          <div className="text-sm text-gray-600">
            <p>Last backup: <span className="font-medium">Today, 10:30 AM</span></p>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Data Export</h2>
            <p className="text-gray-600 mt-1">Export specific data types to CSV format</p>
          </div>
          <Download className="h-8 w-8 text-green-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataTypes.map((type) => (
            <div key={type.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
                <button
                  onClick={() => exportData(type.id)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Import */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Data Import</h2>
            <p className="text-gray-600 mt-1">Import data from CSV files</p>
          </div>
          <Upload className="h-8 w-8 text-purple-600" />
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Data import will overwrite existing records. Create a backup before importing.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="text-sm text-green-600 mt-2">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {dataTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleFileImport(type.id)}
                  disabled={!selectedFile || importLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importLoading ? 'Importing...' : `Import ${type.label}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Maintenance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System Maintenance</h2>
            <p className="text-gray-600 mt-1">Database optimization and maintenance tasks</p>
          </div>
          <RefreshCw className="h-8 w-8 text-orange-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Database Status</h3>
            <p className="text-sm text-green-600">Healthy</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Total Records</h3>
            <p className="text-sm text-gray-600">15,847</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <RefreshCw className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Last Optimization</h3>
            <p className="text-sm text-gray-600">2 days ago</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            <RefreshCw className="h-4 w-4" />
            <span>Optimize Database</span>
          </button>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">2,847</p>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">8,234</p>
            <p className="text-sm text-gray-600">Activities Submitted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">156</p>
            <p className="text-sm text-gray-600">System Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">24</p>
            <p className="text-sm text-gray-600">Program Rules</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;