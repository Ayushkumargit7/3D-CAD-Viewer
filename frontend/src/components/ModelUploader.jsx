import { useState } from 'react';
import axios from 'axios';

function ModelUploader({ setModelUrl, setIsLoading, setError }) {
  const [file, setFile] = useState(null);
  const [exportFormat, setExportFormat] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    setIsLoading(true);
    setError(null);
    setModelUrl(null);

    try {
      // console.log("Uploading file to backend...");
      const response = await axios.post('http://127.0.0.1:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.url) {
        setModelUrl(response.data.url);
      } else {
        setError('Upload succeeded but no URL was returned');
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.response?.data?.message || 'Error uploading file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!exportFormat) {
      setError('Please select an export format');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/export?format=${exportFormat}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `model.${exportFormat.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error exporting the model');
      console.error("Export error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Upload Model</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select 3D Model (STL, OBJ)
          </label>
          <input
            type="file"
            accept=".stl,.obj"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Upload and View
        </button>
      </form>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Export Model</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="">Select format...</option>
              <option value="STL">STL</option>
              <option value="OBJ">OBJ</option>
            </select>
          </div>
          
          <button
            type="button"
            onClick={handleExport}
            disabled={!exportFormat}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200 disabled:bg-gray-400"
          >
            Export Model
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModelUploader;