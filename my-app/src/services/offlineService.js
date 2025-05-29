// Services to handle offline operation mode and detection

// Constants - export RECONNECTION_INTERVAL for use elsewhere
const STORAGE_KEY = 'offline_operations';
const API_CHECK_ENDPOINTS = [
  'http://localhost:5000/api/debug/courses', // Changed from port 3000 to 5000
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
  
  // Completely rewritten checkServerAvailability with more robust error handling
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
          
          if (!response) {
            console.log(`No response from ${endpoint}`);
            continue;  // Try next endpoint
          }
          
          // Make sure we can actually get data, not just that the response exists
          try {
            // Try to read at least some data to verify the connection
            await response.text();
          } catch (readError) {
            console.log(`Could not read response data from ${endpoint}:`, readError);
            continue;  // Try next endpoint
          }
          
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
    } finally {
      // Make absolutely sure isReconnecting gets reset even if everything fails
      setTimeout(() => {
        if (isReconnecting) {
          console.log('Forcing reset of reconnecting flag after timeout');
          isReconnecting = false;
        }
      }, CONNECTION_TIMEOUT + 500);
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
            
            // Try to sync pending operations with better error handling
            if (offlineService.hasPendingOperations()) {
              console.log('Attempting to sync pending operations...');
              try {
                const syncResult = await offlineService.syncOperations();
                if (syncResult.success) {
                  console.log('Sync successful!', syncResult);
                } else {
                  console.error('Sync completed with errors:', syncResult);
                }
              } catch (syncErr) {
                console.error('Error during sync operations:', syncErr);
                // Don't let sync errors affect the reconnection status
              }
            } else {
              console.log('No pending operations to sync');
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
    
    // Set up polling interval with max errors handling
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;
    
    serverCheckInterval = setInterval(() => {
      if (!isReconnecting) {
        offlineService.checkServerAvailability()
          .then(available => {
            if (available) {
              consecutiveErrors = 0;
            }
          })
          .catch(err => {
            console.error('Periodic server check failed:', err);
            consecutiveErrors++;
            
            // If we have too many consecutive errors, reset the reconnecting flag
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              console.log(`Too many consecutive errors (${consecutiveErrors}), resetting reconnecting flag`);
              isReconnecting = false;
              consecutiveErrors = 0;
            }
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
    
    console.log(`Syncing ${operations.length} offline operations...`, operations);
    
    // Process each operation
    const results = [];
    let refreshNeeded = false;
    
    for (const operation of operations) {
      try {
        let response;
        
        switch (operation.type) {
          case 'add':
            // Special handling for temp IDs - ensure we're not using them
            const courseToAdd = { ...operation.course };
            if (courseToAdd.id && typeof courseToAdd.id === 'string' && courseToAdd.id.startsWith('temp_')) {
              delete courseToAdd.id; // Let the server assign a proper ID
            }
            
            // Call API to add course
            console.log(`Syncing ADD operation:`, courseToAdd);
            response = await fetch('/api/courses', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              },
              body: JSON.stringify(courseToAdd),
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || `Server returned ${response.status}`);
            }
            
            const addedCourse = await response.json();
            results.push({ success: true, operation, serverData: addedCourse });
            refreshNeeded = true;
            
            // Also update local cached_courses immediately with proper cleanup
            try {
              const cachedData = localStorage.getItem('cached_courses');
              if (cachedData) {
                const courses = JSON.parse(cachedData);
                
                // First remove ALL temp entries that could be duplicates
                const updatedCourses = courses.filter(c => 
                  !(typeof c.id === 'string' && c.id.startsWith('temp_'))
                );
                
                // Add the server-assigned course 
                updatedCourses.push(addedCourse);
                
                // Save back to storage
                localStorage.setItem('cached_courses', JSON.stringify(updatedCourses));
                console.log('Updated local cache after sync - added course with ID:', addedCourse.id);
              }
            } catch (cacheErr) {
              console.error('Error updating local cache after add sync:', cacheErr);
            }
            
            // Dispatch event to notify UI about this specific change
            window.dispatchEvent(new CustomEvent('courseUpdated', {
              detail: { 
                action: 'add', 
                course: addedCourse,
                synced: true 
              }
            }));
            break;
            
          case 'update':
            // Call API to update course
            console.log(`Syncing UPDATE operation:`, operation.id, operation.course);
            response = await fetch(`/api/courses/${operation.id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              },
              body: JSON.stringify(operation.course),
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || `Server returned ${response.status}`);
            }
            
            const updatedCourse = await response.json();
            results.push({ success: true, operation, serverData: updatedCourse });
            refreshNeeded = true;
            
            // Also update local cached_courses immediately
            try {
              const cachedData = localStorage.getItem('cached_courses');
              if (cachedData) {
                const courses = JSON.parse(cachedData);
                // Update the course in the cache
                const updatedCourses = courses.map(c => 
                  c.id === operation.id ? updatedCourse : c
                );
                localStorage.setItem('cached_courses', JSON.stringify(updatedCourses));
              }
            } catch (cacheErr) {
              console.error('Error updating local cache after update sync:', cacheErr);
            }
            
            // Dispatch event to notify UI about this specific change
            window.dispatchEvent(new CustomEvent('courseUpdated', {
              detail: { 
                action: 'update', 
                course: updatedCourse,
                synced: true 
              }
            }));
            break;
            
          case 'delete':
            // Call API to delete course
            console.log(`Syncing DELETE operation:`, operation.id);
            response = await fetch(`/api/courses/${operation.id}`, {
              method: 'DELETE',
              headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok && response.status !== 404) {
              // 404 is acceptable for delete operations (already deleted)
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || `Server returned ${response.status}`);
            }
            
            results.push({ success: true, operation });
            refreshNeeded = true;
            
            // Also update local cached_courses immediately
            try {
              const cachedData = localStorage.getItem('cached_courses');
              if (cachedData) {
                const courses = JSON.parse(cachedData);
                // Remove the deleted course from the cache
                const updatedCourses = courses.filter(c => c.id !== operation.id);
                localStorage.setItem('cached_courses', JSON.stringify(updatedCourses));
              }
            } catch (cacheErr) {
              console.error('Error updating local cache after delete sync:', cacheErr);
            }
            
            // Dispatch event to notify UI about this specific change
            window.dispatchEvent(new CustomEvent('courseUpdated', {
              detail: { 
                action: 'delete', 
                id: operation.id,
                synced: true 
              }
            }));
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
        console.error(`Failed to sync operation:`, operation, error);
        results.push({ success: false, operation, error: error.message });
      }
    }
    
    // Clear operations if all successful
    if (results.every(r => r.success)) {
      clearOperations();
      console.log('All operations synced successfully and cleared from storage');
    } else {
      // Keep only failed operations
      const failedOps = operations.filter((op, i) => !results[i].success);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(failedOps));
      console.log(`${failedOps.length} operations failed to sync and will be retried later`);
    }
    
    // Force a reload of courses from server after successful sync
    if (refreshNeeded) {
      console.log('Sync completed successfully - triggering course refresh');
      
      // Add a more aggressive refresh approach
      setTimeout(() => {
        // Force a complete data refresh rather than just an event
        window.dispatchEvent(new CustomEvent('syncOperationsComplete', {
          detail: {
            timestamp: Date.now(),
            results: results,
            success: results.every(r => r.success),
            refreshNeeded: true,
            forceFullRefresh: true
          }
        }));
        
        // Also dispatch the standard event for compatibility
        window.dispatchEvent(new CustomEvent('courseUpdated', {
          detail: { action: 'refresh', timestamp: Date.now() }
        }));
      }, 100);
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
