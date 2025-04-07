import React, { useState, useEffect } from 'react';
import offlineService from '../services/offlineService';

const ConnectionStatus = () => {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    isServerAvailable: false
  });
  
  const [showToast, setShowToast] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastManualCheck, setLastManualCheck] = useState(0);

  useEffect(() => {
    // Register for status updates
    const unsubscribe = offlineService.addListener(newStatus => {
      console.log("Connection status changed:", newStatus);
      setStatus(newStatus);
      
      // Show the toast on status change to offline
      if (!newStatus.isOnline || !newStatus.isServerAvailable) {
        setShowToast(true);
      }
    });
    
    // Monitor pending operations
    const checkPendingOps = () => {
      const ops = offlineService.getOfflineOperations();
      setPendingOperations(ops.length);
    };
    
    checkPendingOps();
    const interval = setInterval(checkPendingOps, 2000);
    
    // Clean up
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  // Determine what status indicator to show
  const getStatusIndicator = () => {
    if (!status.isOnline) {
      return {
        color: 'red',
        message: 'Network Offline'
      };
    } else if (!status.isServerAvailable) {
      return {
        color: 'orange',
        message: 'Server Unavailable'
      };
    } else if (pendingOperations > 0) {
      return {
        color: 'blue',
        message: `Syncing (${pendingOperations})`
      };
    } else {
      return {
        color: 'green',
        message: 'Connected'
      };
    }
  };

  const indicator = getStatusIndicator();
  
  const handleClose = () => {
    setShowToast(false);
  };
  
  const handleManualSync = async () => {
    // Prevent multiple rapid clicks - only allow check every 2 seconds
    const now = Date.now();
    if (now - lastManualCheck < 2000) {
      return;
    }
    
    setLastManualCheck(now);
    
    if (status.isOnline) {
      const serverAvailable = await offlineService.manualReconnect();
      
      if (serverAvailable && pendingOperations > 0) {
        try {
          await offlineService.syncOperations();
          setPendingOperations(0);
        } catch (err) {
          console.error("Error syncing operations:", err);
        }
      }
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <div 
          className={`flex items-center space-x-2 px-3 py-1 rounded-full shadow-md bg-white border border-${indicator.color}-500`}
          onClick={handleManualSync}
          style={{ cursor: 'pointer' }}
        >
          <div className={`w-3 h-3 rounded-full bg-${indicator.color}-500`}></div>
          <span className="text-sm font-medium">{indicator.message}</span>
          {pendingOperations > 0 && status.isOnline && status.isServerAvailable && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleManualSync();
              }} 
              className="text-blue-500 text-xs ml-1 hover:underline"
            >
              Sync now
            </button>
          )}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-16 right-4 z-50 max-w-sm">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Connection Status</h3>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            <p className="mb-3">
              {!status.isOnline 
                ? "You are currently offline. Changes will be saved locally and synced when your network connection is restored." 
                : !status.isServerAvailable
                  ? "The server is currently unavailable. Changes will be saved locally and synced when the server is accessible again."
                  : "Connection restored. Your changes will sync automatically."}
            </p>
            {pendingOperations > 0 && (
              <p className="text-sm text-blue-600">
                {pendingOperations} pending {pendingOperations === 1 ? 'change' : 'changes'} will sync automatically when connection is restored.
              </p>
            )}
            {/* Removed the duplicate "Try Reconnect Now" button as requested */}
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectionStatus;
