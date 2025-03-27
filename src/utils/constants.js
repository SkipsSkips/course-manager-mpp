// Application-wide constants
export const APP_CONSTANTS = {
  ITEMS_PER_PAGE: 6,
  SIMULATION_INTERVAL: 10000, // 10 seconds
  MIN_PRICE: 9.99,
  MAX_PRICE: 299.99,
  DEFAULT_CATEGORY: "Programming",
  DEFAULT_RATING: 4.0
};

// Price highlight thresholds
export const PRICE_THRESHOLDS = {
  LOW_PERCENTAGE: 0.25, // Bottom 25%
  HIGH_PERCENTAGE: 0.25, // Top 25%
  AVERAGE_RANGE: 0.3     // Within 30% of average
};

// Status messages
export const MESSAGES = {
  COURSE_ADDED: "Course added successfully!",
  COURSE_UPDATED: "Course updated successfully!",
  COURSE_DELETED: "Course deleted successfully!",
  ERROR_SAVING: "Error saving course",
  ERROR_LOADING: "Error loading courses",
  SIMULATION_STARTED: "Course simulation started",
  SIMULATION_STOPPED: "Course simulation stopped"
};
