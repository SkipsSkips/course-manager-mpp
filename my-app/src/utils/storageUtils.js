/**
 * Utility functions for safer localStorage operations
 */

// Maximum size for localStorage items (in bytes)
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB to be safe

/**
 * Safely store data in localStorage
 * @param {string} key - localStorage key
 * @param {any} data - Data to store
 * @param {boolean} stripImages - Whether to strip base64 images
 * @returns {boolean} - Whether operation was successful
 */
export const safeStore = (key, data, stripImages = false) => {
  try {
    let processedData = data;
    
    // Process data if it's an array of courses and stripImages is true
    if (stripImages && Array.isArray(data)) {
      processedData = data.map(course => {
        if (!course.image || typeof course.image !== 'string' || !course.image.startsWith('data:')) {
          return course;
        }
        
        return {
          ...course,
          image: 'IMAGE_PLACEHOLDER'
        };
      });
    }
    
    const jsonString = JSON.stringify(processedData);
    
    // Check if data is too large
    if (jsonString.length > MAX_STORAGE_SIZE) {
      console.warn(`Data for key '${key}' exceeds safe size limit (${jsonString.length} bytes)`);
      return false;
    }
    
    localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.error(`Error storing data for key '${key}':`, error);
    return false;
  }
};

/**
 * Safely retrieve data from localStorage
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} - Retrieved data or default value
 */
export const safeRetrieve = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving data for key '${key}':`, error);
    return defaultValue;
  }
};

/**
 * Safely remove data from localStorage
 * @param {string} key - localStorage key
 * @returns {boolean} - Whether operation was successful
 */
export const safeRemove = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing data for key '${key}':`, error);
    return false;
  }
};

export default {
  safeStore,
  safeRetrieve,
  safeRemove
};
