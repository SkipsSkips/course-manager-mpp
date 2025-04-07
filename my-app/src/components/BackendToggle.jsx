import React, { useState, useEffect } from 'react';
import { courseService } from '../services/courseService';

const BackendToggle = () => {
  const [isRemote, setIsRemote] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  
  useEffect(() => {
    // Check if the backend API is configured to use remote
    if (courseService.isUsingRemoteBackend) {
      setIsRemote(courseService.isUsingRemoteBackend());
    }
    
    // Check server availability
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/debug/courses', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        setIsServerAvailable(response.ok);
      } catch (error) {
        setIsServerAvailable(false);
      }
    };
    
    checkServer();
    const interval = setInterval(checkServer, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const toggleBackend = () => {
    if (courseService.setUseRemoteBackend) {
      const newMode = courseService.setUseRemoteBackend(!isRemote);
      setIsRemote(newMode);
      // Reload the page to refresh data from new source
      window.location.reload();
    }
  };
  
  return (
    <div className="fixed bottom-2 left-2 z-50 bg-white p-2 rounded shadow-md border border-gray-300">
      <div className="flex items-center space-x-2">
        <div className="flex items-center mr-2">
          <span className={`inline-block w-3 h-3 rounded-full ${isServerAvailable ? 'bg-green-500' : 'bg-red-500'} mr-1`}></span>
          <span className="text-xs font-medium">Server: {isServerAvailable ? 'Online' : 'Offline'}</span>
        </div>
        <span className="text-xs font-medium">
          {isRemote ? 'Using Backend API' : 'Using Local Data'}
        </span>
        <button 
          onClick={toggleBackend}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isRemote && !isServerAvailable}
        >
          Switch to {isRemote ? 'Local' : 'Backend'}
        </button>
      </div>
    </div>
  );
};

export default BackendToggle;
