import { useState } from 'react';
import ModelViewer from './components/ModelViewer';
import ModelUploader from './components/ModelUploader';

function App() {
  const [modelUrl, setModelUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow-lg p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">3D CAD Viewer</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/4 bg-white p-4 rounded-lg shadow-md">
          <ModelUploader 
            setModelUrl={setModelUrl}
            setIsLoading={setIsLoading}
            setError={setError}
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
        
        <div className="lg:w-3/4 bg-white rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : modelUrl ? (
            <ModelViewer modelUrl={modelUrl} />
          ) : (
            <div className="flex items-center justify-center h-[650px] text-gray-500">
              <p>Upload a model to view it here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;