// Services to handle offline operation mode and detection

// Constants - export RECONNECTION_INTERVAL for use elsewhere
const STORAGE_KEY = 'offline_operations';
const API_CHECK_ENDPOINTS = [
  'http://localhost:5000/api/debug/courses',
  '/api/debug/courses'  // Add relative path as fallback
];
const CONNECTION_TIMEOUT = 2000; // 2 seconds
export const RECONNECTION_INTERVAL = 5000; // Reduced to 5 seconds for faster reconnection
const POLLING_INTERVAL = 3000; // 3 seconds for more responsive checking
const INITIAL_CHECK_DELAY = 100; // Very short delay for initial check

// State variables
let isServerAvailable = false; // Tracks if the backend server is available
let isOnline = navigator.onLine; // Tracks if the browser is online
let serverCheckInterval = null;
let reconnectionInterval = null;
// Removed unused initialCheckTimer variable
let isInitialized = false; // Track if the service has been initialized
let reconnectionAttempts = 0;
let isReconnecting = false; // Track if we're currently in a reconnection attempt

// Listener management
const listeners = new Set();

// Helper method to notify all listeners of state changes
const notifyListeners = () => {
  const status = {
    isOnline,
    isServerAvailable,
  };
  
  console.log(`Notifying listeners of status change: online=${isOnline}, server=${isServerAvailable}`);
  
  listeners.forEach(listener => {
    try {
      listener(status);
    } catch (err) {
      console.error("Error in connection status listener:", err);
    }
  });
};

// Browser online/offline event handlers
const handleOnline = () => {
  console.log('Browser network status: ONLINE');
  isOnline = true;
  notifyListeners();
  
  // Immediately check server when network comes back
  console.log('Network came back - checking server immediately');
  offlineService.checkServerAvailability()
    .catch(err => console.error("Error checking server after network restored:", err));
};

const handleOffline = () => {
  console.log('Browser network status: OFFLINE');
  isOnline = false;
  
  // If network is offline, server is definitely not available
  if (isServerAvailable) {
    isServerAvailable = false;
    notifyListeners();
  } else {
    notifyListeners();
  }
};

// Offline operations storage
const getOfflineOperations = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to get offline operations:', e);
    return [];
  }
};

const saveOperation = (operation) => {
  try {
    const operations = getOfflineOperations();
    operations.push({
      ...operation,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    return true;
  } catch (e) {
    console.error('Failed to save offline operation:', e);
    return false;
  }
};

const clearOperations = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear offline operations:', e);
    return false;
  }
};

// The offlineService object with public methods
const offlineService = {
  // Properties accessible from outside
  get isOnline() {
    return isOnline;
  },
  
  get isServerAvailable() {
    return isServerAvailable;
  },
  
  // Initialize the service - should be called right when the app starts
  initialize: () => {
    if (isInitialized) return; // Prevent double initialization
    
    console.log('Initializing offline service...');
    isInitialized = true;
    
    // Start polling and setup listeners
    offlineService.startPolling();
    
    // Check immediately
    setTimeout(() => {
      offlineService.checkServerAvailability()
        .then(available => {
          console.log(`Initial server check result: ${available ? 'AVAILABLE' : 'UNAVAILABLE'}`);
          if (!available && isOnline) {
            // Start reconnection attempts if online but server unavailable
            offlineService.startReconnectionAttempts();
          }
        })
        .catch(err => {
          console.error("Initial server check failed:", err);
        });
    }, INITIAL_CHECK_DELAY);
  },
  
  // Event listener registration
  addListener: (callback) => {
    if (typeof callback !== 'function') {
      console.warn("Invalid listener provided to offlineService");
      return () => {};
    }
    
    listeners.add(callback);
    
    // Immediately notify with current status
    try {
      callback({
        isOnline,
        isServerAvailable,
      });
    } catch (err) {
      console.error("Error in newly added connection status listener:", err);
    }
    
    // Make sure service is initialized
    if (!isInitialized) {
      offlineService.initialize();
    }
    
    return () => {
      listeners.delete(callback);
    };
  },
  
  // Completely rewritten checkServerAvailability with robust error handling
  checkServerAvailability: async () => {
    if (isReconnecting) {
      console.log('Already checking server availability, skipping redundant check');
      return isServerAvailable;
    }
    
    isReconnecting = true;
    
    try {
      // Only check if we have network connectivity
      if (!navigator.onLine) {
        if (isServerAvailable) {
          isServerAvailable = false;
          console.log('Network offline - marking server as unavailable');
          notifyListeners();
        }
        isReconnecting = false;
        return false;
      }
      
      console.log(`Checking server availability...`);
      
      // Try all endpoints until one succeeds
      for (const endpoint of API_CHECK_ENDPOINTS) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            mode: 'cors',
            signal: controller.signal,
            credentials: 'omit'
          });
          
          clearTimeout(timeoutId);
          
          // If we get here, the server is available
          const wasAvailable = isServerAvailable;
          isServerAvailable = response.ok;
          
          console.log(`Server check result: ${isServerAvailable ? '✅ AVAILABLE' : '❌ UNAVAILABLE'}`);
          
          // If status changed, notify listeners
          if (wasAvailable !== isServerAvailable) {
            if (isServerAvailable) {
              // Server just became available
              console.log('Server is back online - stopping reconnection attempts');
              offlineService.stopReconnectionAttempts();
              reconnectionAttempts = 0;
              
              // Try to sync any pending operations
              if (offlineService.hasPendingOperations()) {
                console.log('Attempting to sync pending operations...');
                offlineService.syncOperations().catch(err => {
                  console.error('Error syncing operations:', err);
                });
              }
            } else {
              // Server just became unavailable
              console.log('Server became unavailable - starting reconnection attempts');
              offlineService.startReconnectionAttempts();
            }
            
            notifyListeners();
          }
          
          isReconnecting = false;
          return isServerAvailable;
        } catch (error) {
          // This endpoint failed, try the next one
          console.log(`Endpoint ${endpoint} failed: ${error.toString()}`);
        }
      }
      
      // If we get here, all endpoints failed
      console.log('All server endpoints failed');
      
      const wasAvailable = isServerAvailable;
      isServerAvailable = false;
      
      if (wasAvailable) {
        console.log('Server became unavailable - starting reconnection attempts');
        offlineService.startReconnectionAttempts();
        notifyListeners();
      }
      
      isReconnecting = false;
      return false;
    } catch (error) {
      console.error("Unexpected error checking server availability:", error);
      
      // Safety fallback - mark as unavailable
      if (isServerAvailable) {
        isServerAvailable = false;
        notifyListeners();
      }
      
      isReconnecting = false;
      return false;
    }
  },

  // Enhanced reconnection attempts with better logging
  startReconnectionAttempts: () => {
    // Clear any existing interval first
    offlineService.stopReconnectionAttempts();
    
    console.log(`Starting automatic reconnection attempts every ${RECONNECTION_INTERVAL/1000} seconds`);
    
    reconnectionAttempts = 0;
    
    // Check immediately first - but don't update the attempt counter yet
    offlineService.checkServerAvailability()
      .catch(err => console.error("Initial reconnection attempt failed:", err));
    
    // Set up new reconnection attempts
    reconnectionInterval = setInterval(async () => {
      reconnectionAttempts++;
      console.log(`Attempting to reconnect to server (attempt #${reconnectionAttempts})...`);
      
      try {
        const success = await offlineService.checkServerAvailability();
        if (success) {
          console.log("🎉 Automatic reconnection successful!");
          offlineService.stopReconnectionAttempts();
          reconnectionAttempts = 0;
          
          // Dispatch a global event for components to refresh
          window.dispatchEvent(new CustomEvent('serverReconnected', {
            detail: { timestamp: Date.now() }
          }));
          
          return true;
        } else {
          console.log(`❌ Automatic reconnection attempt #${reconnectionAttempts} failed - will retry`);
        }
      } catch (err) {
        console.error('Reconnection attempt error:', err);
      }
      
      return false;
    }, RECONNECTION_INTERVAL);
    
    return true;
  },

  stopReconnectionAttempts: () => {
    if (reconnectionInterval) {
      console.log('Stopping automatic reconnection attempts');
      clearInterval(reconnectionInterval);
      reconnectionInterval = null;
      reconnectionAttempts = 0;
    }
  },

  manualReconnect: async () => {
    console.log('Manual reconnection attempt initiated...');
    
    // Force clear any existing interval to avoid conflicts
    offlineService.stopReconnectionAttempts();
    
    // Reset connection state to force a fresh check
    isReconnecting = false;
    
    try {
      // Force a fresh network check
      const networkOnline = navigator.onLine;
      console.log(`Network status: ${networkOnline ? 'online' : 'offline'}`);
      
      if (!networkOnline) {
        console.log('⚠️ Cannot reconnect - network is offline');
        return false;
      }
      
      // Now try each endpoint directly with no timeouts
      console.log('Trying each endpoint directly...');
      
      // Try all endpoints until one succeeds
      for (const endpoint of API_CHECK_ENDPOINTS) {
        try {
          console.log(`Manual check: trying ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Manual-Reconnect': 'true'
            },
            mode: 'cors',
            credentials: 'omit'
          });
          
          // If we get here, we reached the server
          const success = response.ok;
          
          if (success) {
            console.log(`🎉 Manual reconnection SUCCESS via ${endpoint}`);
            isServerAvailable = true;
            notifyListeners();
            
            // Dispatch a global event for components to refresh
            window.dispatchEvent(new CustomEvent('serverReconnected', {
              detail: { timestamp: Date.now(), manual: true }
            }));
            
            // Try to sync pending operations
            if (offlineService.hasPendingOperations()) {
              console.log('Attempting to sync pending operations...');
              try {
                await offlineService.syncOperations();
                console.log('Sync successful!');
              } catch (syncErr) {
                console.error('Error syncing operations:', syncErr);
              }
            }
            
            return true;
          }
          
          console.log(`Manual check for ${endpoint} failed with status: ${response.status}`);
        } catch (error) {
          console.log(`Manual check for ${endpoint} failed: ${error.toString()}`);
        }
      }
      
      // If we get here, all endpoints failed
      console.log('⚠️ Manual reconnection FAILED - all endpoints unreachable');
      isServerAvailable = false;
      notifyListeners();
      
      // Restart the reconnection attempts
      offlineService.startReconnectionAttempts();
      
      return false;
    } catch (error) {
      console.error('Manual reconnection error:', error);
      
      // Restart the reconnection attempts
      offlineService.startReconnectionAttempts();
      
      return false;
    }
  },
  
  // Improved startPolling with better error recovery
  startPolling: () => {
    // Clear any existing intervals
    offlineService.stopPolling();
    
    // Make initial check immediately
    console.log('Starting server availability polling...');
    
    // Listen for browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for global reconnect events
    window.addEventListener('reconnectServer', () => offlineService.manualReconnect());
    
    // Set up polling interval - more frequent polling for better responsiveness
    serverCheckInterval = setInterval(() => {
      if (!isReconnecting) {
        offlineService.checkServerAvailability()
          .catch(err => {
            console.error('Periodic server check failed:', err);
          });
      }
    }, POLLING_INTERVAL);
    
    console.log(`Server availability polling started (every ${POLLING_INTERVAL/1000} seconds)`);
  },

  stopPolling: () => {
    if (serverCheckInterval) {
      clearInterval(serverCheckInterval);
      serverCheckInterval = null;
      
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('reconnectServer', offlineService.manualReconnect);
      
      console.log('Server availability polling stopped');
    }
  },
  
  // Offline operations management
  getOfflineOperations,
  
  saveOperation,
  
  clearOperations,
  
  // Check if there are pending operations
  hasPendingOperations: () => {
    return getOfflineOperations().length > 0;
  },
  
  // Sync offline operations with server
  syncOperations: async () => {
    // Only sync if online and server available
    if (!isOnline || !isServerAvailable) {
      return { success: false, message: 'Not online or server unavailable' };
    }
    
    const operations = getOfflineOperations();
    if (operations.length === 0) {
      return { success: true, message: 'No operations to sync' };
    }
    
    // Process each operation
    const results = [];
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'add':
            // Call API to add course
            await fetch('/api/courses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(operation.course),
            });
            results.push({ success: true, operation });
            break;
            
          case 'update':
            // Call API to update course
            await fetch(`/api/courses/${operation.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(operation.course),
            });
            results.push({ success: true, operation });
            break;
            
          case 'delete':
            // Call API to delete course
            await fetch(`/api/courses/${operation.id}`, {
              method: 'DELETE',
            });
            results.push({ success: true, operation });
            break;
            
          default:
            // Handle unknown operation type
            console.warn(`Unknown operation type: ${operation.type}`);
            results.push({ 
              success: false, 
              operation, 
              error: `Unknown operation type: ${operation.type}`
            });
            break;
        }
      } catch (error) {
        results.push({ success: false, operation, error: error.message });
      }
    }
    
    // Clear operations if all successful
    if (results.every(r => r.success)) {
      clearOperations();
    } else {
      // Keep only failed operations
      const failedOps = operations.filter((op, i) => !results[i].success);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(failedOps));
    }
    
    return { success: true, results };
  },
};

// Initialize polling when module loads to ensure we start checking server availability immediately
setTimeout(() => {
  console.log('Initializing server availability monitoring...');
  offlineService.initialize();
}, 0);

// Export the service
export default offlineService;
