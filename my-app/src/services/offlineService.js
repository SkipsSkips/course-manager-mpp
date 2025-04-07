// Offline Service - Manages offline detection and synchronization

const STORAGE_KEY = 'offline_operations';
const SERVER_CHECK_URL = '/api/debug/courses';

const offlineService = {
  // State
  isOnline: navigator.onLine,
  isServerAvailable: true,
  listeners: [],
  checkServerInterval: null,
  
  // Initialize the service
  init() {
    // Set up event listeners for online/offline events
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
    
    // Initial check
    this.checkServerAvailability();
    
    // Set up interval for checking server
    this.checkServerInterval = setInterval(() => {
      this.checkServerAvailability();
    }, 30000); // Check every 30 seconds
    
    return this;
  },

  // Handle browser online/offline events
  handleOnlineStatusChange() {
    const previousIsOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    
    if (previousIsOnline !== this.isOnline) {
      console.log(`Network status changed: ${this.isOnline ? 'Online' : 'Offline'}`);
      
      if (this.isOnline) {
        // Came back online, check server and sync if available
        this.checkServerAvailability().then(serverAvailable => {
          if (serverAvailable) {
            this.syncOfflineOperations();
          }
        });
      }
      
      // Notify listeners
      this.notifyListeners();
    }
  },

  // Improved server availability checker
  async checkServerAvailability() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch('http://localhost:5000/api/debug/courses', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const isAvailable = response.ok;
      if (this.isServerAvailable !== isAvailable) {
        this.isServerAvailable = isAvailable;
        this.notifyListeners();
      }
      
      return isAvailable;
    } catch (error) {
      // If we get here, the server is likely down
      if (this.isServerAvailable !== false) {
        this.isServerAvailable = false;
        this.notifyListeners();
      }
      return false;
    }
  },

  // Reduce polling interval and improve offline detection
  startPolling() {
    this.stopPolling();
    
    // Check immediately
    this.checkServerAvailability();
    
    // Set up shorter polling interval (3 seconds)
    this.checkServerInterval = setInterval(this.checkServerAvailability.bind(this), 3000);
    
    // Listen for browser online/offline events
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
  },

  // Stop polling
  stopPolling() {
    if (this.checkServerInterval) {
      clearInterval(this.checkServerInterval);
      this.checkServerInterval = null;
    }
  },

  // Add a status change listener
  addListener(callback) {
    this.listeners.push(callback);
    // Immediately call with current status
    callback({
      isOnline: this.isOnline,
      isServerAvailable: this.isServerAvailable
    });
    
    return () => this.removeListener(callback);
  },

  // Remove a listener
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  },

  // Notify all listeners of status changes
  notifyListeners() {
    const status = {
      isOnline: this.isOnline,
      isServerAvailable: this.isServerAvailable
    };
    
    this.listeners.forEach(callback => callback(status));
  },

  // Save an operation to be performed later
  saveOperation(operation) {
    const operations = this.getOfflineOperations();
    operations.push({
      ...operation,
      timestamp: new Date().getTime()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    console.log('Operation saved for later:', operation);
  },

  // Get all stored offline operations
  getOfflineOperations() {
    const operations = localStorage.getItem(STORAGE_KEY);
    return operations ? JSON.parse(operations) : [];
  },

  // Clear a specific operation after it's processed
  clearOperation(index) {
    const operations = this.getOfflineOperations();
    operations.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
  },

  // Clear all stored operations
  clearAllOperations() {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Synchronize offline operations with the server
  async syncOfflineOperations() {
    if (!this.isOnline || !this.isServerAvailable) {
      console.log('Cannot sync: Either offline or server unavailable');
      return;
    }
    
    const operations = this.getOfflineOperations();
    if (operations.length === 0) {
      return;
    }
    
    console.log(`Syncing ${operations.length} offline operations...`);
    
    // Process operations in order they were created
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      try {
        switch (operation.type) {
          case 'add':
            await this.processSyncAdd(operation.course);
            break;
          case 'update':
            await this.processSyncUpdate(operation.id, operation.course);
            break;
          case 'delete':
            await this.processSyncDelete(operation.id);
            break;
        }
        // Operation succeeded, remove it from storage
        this.clearOperation(0); // Always remove the first one since array shifts
      } catch (error) {
        console.error(`Error syncing operation ${operation.type}:`, error);
        // If we hit an error, stop processing to maintain order
        // We'll try again next time
        break;
      }
    }
    
    // After sync, dispatch event to refresh UI
    window.dispatchEvent(new Event('courseUpdated'));
  },

  // Process a saved 'add' operation
  async processSyncAdd(course) {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(course),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync add operation');
    }
    
    return await response.json();
  },

  // Process a saved 'update' operation
  async processSyncUpdate(id, course) {
    const response = await fetch(`/api/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(course),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync update operation');
    }
    
    return await response.json();
  },

  // Process a saved 'delete' operation
  async processSyncDelete(id) {
    const response = await fetch(`/api/courses/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync delete operation');
    }
    
    return true;
  }
};

// Export initialized instance
export default offlineService.init();
