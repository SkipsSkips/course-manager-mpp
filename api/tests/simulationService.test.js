const { simulationService } = require('../services/simulationService');
const { coursesData } = require('../models/courseModel');
const { generateMockCourse, generateMockCourses } = require('../utils/mockGenerator');

// Mock dependencies
jest.mock('../utils/mockGenerator', () => ({
  generateMockCourse: jest.fn(),
  generateMockCourses: jest.fn()
}));

// Store original courses for restoration
let originalCourses;
let originalSetInterval;
let originalClearInterval;

describe('Simulation Service', () => {
  // Setup and teardown
  beforeEach(() => {
    // Store originals
    originalCourses = [...coursesData.courses];
    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    
    // Mock interval functions
    global.setInterval = jest.fn(() => 123); // Return a mock interval ID
    global.clearInterval = jest.fn();
    
    // Reset mock functions and state
    jest.clearAllMocks();
    simulationService.isRunning = false;
    simulationService.intervalId = null;
    simulationService.listeners = [];
    
    // Reset test data
    coursesData.courses = [
      { id: 1, title: 'Test Course 1' },
      { id: 2, title: 'Test Course 2' },
      { id: 3, title: 'Test Course 3' },
      { id: 4, title: 'Test Course 4' },
      { id: 5, title: 'Test Course 5' },
      { id: 6, title: 'Test Course 6' }
    ];
    
    // Set up mock implementations
    generateMockCourse.mockImplementation(() => ({
      title: 'Mock Course',
      instructor: 'Mock Instructor',
      category: 'Testing',
      lessons: 5,
      price: 29.99
    }));
    
    generateMockCourses.mockImplementation((count) => {
      const courses = [];
      for (let i = 0; i < count; i++) {
        courses.push({
          title: `Mock Course ${i + 1}`,
          instructor: 'Mock Instructor',
          category: 'Testing',
          lessons: 5,
          price: 29.99
        });
      }
      return courses;
    });
  });
  
  afterEach(() => {
    // Restore originals
    coursesData.courses = originalCourses;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    
    // Clean up
    if (simulationService.isRunning) {
      simulationService.stop();
    }
  });
  
  // TEST START SIMULATION
  describe('start', () => {
    // Test 1: Start simulation
    test('should start the simulation if not running', () => {
      expect(simulationService.isRunning).toBe(false);
      
      const result = simulationService.start();
      
      expect(simulationService.isRunning).toBe(true);
      expect(global.setInterval).toHaveBeenCalledWith(
        expect.any(Function), 
        simulationService.simulationInterval
      );
      expect(simulationService.intervalId).toBe(123);
      expect(result).toEqual({
        success: true,
        message: 'Simulation started'
      });
    });
    
    // Test 2: Start simulation when already running
    test('should do nothing if simulation is already running', () => {
      // First start
      simulationService.start();
      const firstIntervalId = simulationService.intervalId;
      
      // Clear mock to check if it's called again
      jest.clearAllMocks();
      
      // Try to start again
      const result = simulationService.start();
      
      // Should not set a new interval
      expect(global.setInterval).not.toHaveBeenCalled();
      expect(simulationService.intervalId).toBe(firstIntervalId);
      expect(result).toBeUndefined();
    });
  });
  
  // TEST STOP SIMULATION
  describe('stop', () => {
    // Test 3: Stop simulation
    test('should stop the simulation if running', () => {
      // First start the simulation
      simulationService.start();
      expect(simulationService.isRunning).toBe(true);
      
      const result = simulationService.stop();
      
      expect(simulationService.isRunning).toBe(false);
      expect(global.clearInterval).toHaveBeenCalledWith(123);
      expect(result).toEqual({
        success: true,
        message: 'Simulation stopped'
      });
    });
    
    // Test 4: Stop simulation when not running
    test('should do nothing if simulation is not running', () => {
      expect(simulationService.isRunning).toBe(false);
      
      const result = simulationService.stop();
      
      expect(global.clearInterval).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
  
  // TEST GET STATUS
  describe('getStatus', () => {
    // Test 5: Get status
    test('should return the current simulation status', () => {
      simulationService.isRunning = true;
      simulationService.simulationInterval = 5000;
      
      const status = simulationService.getStatus();
      
      expect(status).toEqual({
        isRunning: true,
        interval: 5000,
        numberOfCourses: 6
      });
    });
  });
  
  // TEST LISTENERS
  describe('listeners', () => {
    // Test 6: Add listener
    test('should add a valid listener function', () => {
      const listener = jest.fn();
      
      const result = simulationService.addListener(listener);
      
      expect(result).toBe(true);
      expect(simulationService.listeners).toContain(listener);
    });
    
    // Test 7: Add invalid listener
    test('should not add an invalid listener', () => {
      const result = simulationService.addListener('not a function');
      
      expect(result).toBe(false);
      expect(simulationService.listeners).toHaveLength(0);
    });
    
    // Test 8: Remove listener
    test('should remove an existing listener', () => {
      const listener = jest.fn();
      simulationService.listeners = [listener];
      
      const result = simulationService.removeListener(listener);
      
      expect(result).toBe(true);
      expect(simulationService.listeners).toHaveLength(0);
    });
    
    // Test 9: Remove non-existent listener
    test('should return false when removing a non-existent listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      simulationService.listeners = [listener1];
      
      const result = simulationService.removeListener(listener2);
      
      expect(result).toBe(false);
      expect(simulationService.listeners).toContain(listener1);
    });
    
    // Test 10: Notify listeners
    test('should notify all listeners with an event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      simulationService.listeners = [listener1, listener2];
      
      const event = { action: 'test', id: 123 };
      simulationService._notifyListeners(event);
      
      expect(listener1).toHaveBeenCalledWith(event);
      expect(listener2).toHaveBeenCalledWith(event);
    });
    
    // Test 11: Handle listener errors
    test('should handle errors from listeners', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const goodListener = jest.fn();
      const badListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      simulationService.listeners = [goodListener, badListener];
      
      simulationService._notifyListeners({ action: 'test' });
      
      expect(goodListener).toHaveBeenCalled();
      expect(badListener).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in simulation listener:', 
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  // TEST SIMULATION CYCLE
  describe('_runSimulationCycle', () => {
    // Test 12: Add courses simulation
    test('should add courses when random value is low', () => {
      // Mock Math.random to force "add" path
      const mockMath = Object.create(global.Math);
      mockMath.random = jest.fn(() => 0.1); // Low value for add branch
      global.Math = mockMath;
      
      // Mock generateMockCourses to return two courses
      generateMockCourses.mockReturnValue([
        { title: 'New Course 1' },
        { title: 'New Course 2' }
      ]);
      
      // Add a listener to verify notification
      const listener = jest.fn();
      simulationService.addListener(listener);
      
      // Run a simulation cycle
      simulationService._runSimulationCycle();
      
      // Verify two courses were added
      expect(coursesData.courses).toHaveLength(8);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        action: 'add'
      }));
      
      // Restore original Math
      global.Math = originalMath;
    });
    
    // Test 13: Delete courses simulation
    test('should delete courses when random value is high', () => {
      // Mock Math.random to force "delete" path
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom.mockReturnValueOnce(0.6) // High value for delete branch
               .mockReturnValueOnce(0.6) // For numCoursesToDelete (2)
               .mockReturnValueOnce(0.1) // For first course selection
               .mockReturnValueOnce(0.5); // For second course selection
      
      // Add a listener to verify notification
      const listener = jest.fn();
      simulationService.addListener(listener);
      
      // Run a simulation cycle
      simulationService._runSimulationCycle();
      
      // Verify courses were deleted
      expect(coursesData.courses.length).toBeLessThan(6);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        action: 'delete'
      }));
      
      // Restore original random
      mockRandom.mockRestore();
    });
    
    // Test 14: Error handling in simulation cycle
    test('should handle errors in the simulation cycle', () => {
      // Mock an error in the simulation
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Simulation error');
      
      // Force an error
      jest.spyOn(Math, 'random').mockImplementation(() => {
        throw mockError;
      });
      
      // Run simulation cycle
      simulationService._runSimulationCycle();
      
      // Verify error was handled
      expect(consoleErrorSpy).toHaveBeenCalledWith('Simulation error:', mockError);
      
      // Courses should remain unchanged
      expect(coursesData.courses).toHaveLength(6);
      
      // Restore original implementations
      consoleErrorSpy.mockRestore();
      Math.random.mockRestore();
    });
  });
});
