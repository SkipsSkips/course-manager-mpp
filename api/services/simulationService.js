const { coursesData } = require('../models/courseModel');
const { generateMockCourse, generateMockCourses } = require('../utils/mockGenerator');

// Service for simulating CRUD operations
class SimulationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.simulationInterval = 10000; // 10 seconds
    this.listeners = [];
  }

  // Start the simulation
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting CRUD simulation');
    
    this.intervalId = setInterval(() => {
      this._runSimulationCycle();
    }, this.simulationInterval);
    
    return { success: true, message: 'Simulation started' };
  }

  // Stop the simulation
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.intervalId);
    this.isRunning = false;
    console.log('Stopping CRUD simulation');
    
    return { success: true, message: 'Simulation stopped' };
  }

  // Get current simulation status
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.simulationInterval,
      numberOfCourses: coursesData.courses.length
    };
  }

  // Register a listener for simulation events
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
      return true;
    }
    return false;
  }

  // Remove a listener
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  // Notify all listeners of an event
  _notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in simulation listener:', error);
      }
    });
  }

  // Run a single simulation cycle
  _runSimulationCycle() {
    try {
      const action = Math.random();
      
      if (action < 0.5) {
        // Add 1-2 new courses (50% chance)
        const numCoursesToAdd = Math.random() < 0.5 ? 1 : 2;
        const newCourses = generateMockCourses(numCoursesToAdd);
        
        for (const newCourse of newCourses) {
          // Get the next ID
          const nextId = coursesData.courses.length > 0 
            ? Math.max(...coursesData.courses.map(c => c.id)) + 1 
            : 1;
            
          const courseWithId = { ...newCourse, id: nextId };
          coursesData.courses.push(courseWithId);
          
          console.log(`Simulation: Added course '${courseWithId.title}' with ID ${courseWithId.id}`);
          this._notifyListeners({ 
            action: 'add', 
            course: courseWithId,
            message: `New course added: ${courseWithId.title}`
          });
        }
      } else if (coursesData.courses.length > 5) {
        // Delete 1-2 random courses (50% chance, if there are enough courses)
        const numCoursesToDelete = Math.random() < 0.5 ? 1 : 2;
        const coursesToDelete = [];
        
        // Create a copy of the course array to avoid modifying while iterating
        const currentCourses = [...coursesData.courses];
        
        for (let i = 0; i < numCoursesToDelete && currentCourses.length > 3; i++) {
          const randomIndex = Math.floor(Math.random() * currentCourses.length);
          const courseToDelete = currentCourses[randomIndex];
          
          if (!coursesToDelete.includes(courseToDelete)) {
            coursesToDelete.push(courseToDelete);
            
            // Find and remove the course from the actual data
            const actualIndex = coursesData.courses.findIndex(c => c.id === courseToDelete.id);
            if (actualIndex !== -1) {
              coursesData.courses.splice(actualIndex, 1);
              
              console.log(`Simulation: Deleted course '${courseToDelete.title}' with ID ${courseToDelete.id}`);
              this._notifyListeners({
                action: 'delete',
                id: courseToDelete.id,
                message: `Course deleted: ${courseToDelete.title}`
              });
            }
          }
          
          currentCourses.splice(randomIndex, 1); // Remove from local array to avoid re-selecting
        }
      }
    } catch (error) {
      console.error('Simulation error:', error);
    }
  }
}

// Create and export a singleton instance
const simulationService = new SimulationService();
module.exports = { simulationService };
