import offlineService from './offlineService';

// Helper function to safely store in localStorage with image stripping
const safelyStoreInLocalStorage = (key, data) => {
  try {
    // If the data is an array of courses, strip out large image data before storing
    if (Array.isArray(data)) {
      // Create a copy without large images
      const strippedData = data.map(course => {
        // Keep a small placeholder instead of the full base64 image
        const strippedCourse = {
          ...course,
          image: course.image ? 'IMAGE_PLACEHOLDER' : null
        };
        return strippedCourse;
      });
      
      localStorage.setItem(key, JSON.stringify(strippedData));
      return true;
    } else {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    }
  } catch (error) {
    console.warn('Failed to store data in localStorage:', error.message);
    return false;
  }
};

// Configuration for API connection
const API_CONFIG = {
  // Set to true to use the backend, false to use local data
  useRemoteBackend: true, // Changed to true to use backend by default
  // Default backend URL (localhost for development)
  baseUrl: 'http://localhost:5000',
};

// Sample data to use when working locally
const SAMPLE_COURSES = [
  {
    id: 1,
    title: "Introduction to Web Development",
    instructor: "John Doe",
    lessons: 12,
    duration: "4h 30m",
    students: 245,
    rating: 4.8,
    price: 49.99,
    category: "Programming",
    image: null
  },
  {
    id: 2,
    title: "Advanced JavaScript Techniques",
    instructor: "Emily Johnson",
    lessons: 15,
    duration: "6h 15m",
    students: 310,
    rating: 4.9,
    price: 69.99,
    category: "Programming",
    image: null
  },
  {
    id: 3,
    title: "UI/UX Design Basics",
    instructor: "Jane Smith",
    lessons: 8,
    duration: "3h 15m",
    students: 187,
    rating: 4.6,
    price: 39.99,
    category: "Design",
    image: null
  },
  {
    id: 4,
    title: "Digital Marketing 101",
    instructor: "Sarah Johnson",
    lessons: 10,
    duration: "3h 0m",
    students: 320,
    rating: 4.7,
    price: 59.99,
    category: "Marketing",
    image: null
  }
];

// Initialize local storage with sample data if empty
const initializeLocalData = () => {
  if (!localStorage.getItem('cached_courses')) {
    safelyStoreInLocalStorage('cached_courses', SAMPLE_COURSES);
  }
};

// Run initialization
initializeLocalData();

export const courseService = {
  getCourses: async (filters = {}) => {
    try {
      if (!API_CONFIG.useRemoteBackend) {
        return courseService.getOfflineCourses(filters);
      }

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      // Don't add any default limits - let backend return all courses
      const url = `${API_CONFIG.baseUrl}/api/courses${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('🔍 Fetching ALL courses from:', url);
      console.log('🔍 Filters applied:', filters);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response received:', {
        coursesCount: data.courses?.length || 0,
        totalItems: data.pagination?.totalItems || 0,
        category: filters.category,
        showingAllCourses: !filters.limit,
        courseIds: data.courses?.map(c => c.id) || []
      });

      // Always return courses array, even if wrapped in pagination
      const courses = data.courses || data || [];
      const pagination = data.pagination || null;

      // Cache the results with timestamp for debugging
      const cacheData = {
        courses,
        timestamp: new Date().toISOString(),
        filters: filters,
        totalFetched: courses.length
      };
      safelyStoreInLocalStorage('cached_courses', cacheData);
      
      return { courses, pagination };
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      return courseService.getOfflineCourses(filters);
    }
  },

  addCourse: async (course) => {
    try {
      if (!API_CONFIG.useRemoteBackend) {
        // Use local storage if not using remote backend
        console.log('Using local storage for adding course');
        
        // Get current courses from storage
        const cachedData = localStorage.getItem('cached_courses');
        let courses = cachedData ? JSON.parse(cachedData) : SAMPLE_COURSES;
        
        // Find highest ID and increment by 1
        const highestId = Math.max(...courses.map(c => typeof c.id === 'number' ? c.id : 0), 0);
        const newId = `temp_${new Date().getTime()}`; // Use temp_ prefix for offline created courses
        
        // Create new course with generated ID
        const newCourse = {
          ...course,
          id: newId,
          students: 0,
          rating: 4.5
        };
        
        // Add to local storage
        courses.push(newCourse);
        safelyStoreInLocalStorage('cached_courses', courses);
        
        // Save as pending operation to be synced later
        console.log('Offline mode: Saving add operation for later sync');
        offlineService.saveOperation({
          type: 'add',
          course: course // Original course without the temp_ ID
        });
        
        // Notify UI
        window.dispatchEvent(new CustomEvent('courseUpdated', {
          detail: { action: 'add', course: newCourse }
        }));
        
        return newCourse;
      }
      
      const response = await fetch(`${API_CONFIG.baseUrl}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(course)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const newCourse = await response.json();
      console.log('Course added successfully:', newCourse);

      // Force refresh of cached data
      await courseService.getCourses();
      
      // Dispatch a custom event to notify components
      window.dispatchEvent(new CustomEvent('courseAdded', { 
        detail: { course: newCourse } 
      }));

      return newCourse;
    } catch (error) {
      console.error('Error adding course:', error);
      throw error;
    }
  },

  updateCourse: async (id, updatedCourse) => {
    try {
      // Use local storage if not using remote backend
      if (!API_CONFIG.useRemoteBackend || !offlineService.isOnline || !offlineService.isServerAvailable) {
        console.log('Using local storage for updating course');
        
        // Get current courses
        const cachedData = localStorage.getItem('cached_courses');
        let courses = cachedData ? JSON.parse(cachedData) : SAMPLE_COURSES;
        
        // Find and update course
        const index = courses.findIndex(c => c.id === id);
        if (index === -1) {
          throw new Error('Course not found');
        }
        
        // Update course while preserving ID
        const updatedRecord = { ...courses[index], ...updatedCourse, id };
        courses[index] = updatedRecord;
        
        // Save back to storage
        safelyStoreInLocalStorage('cached_courses', courses);
        
        // Notify UI
        window.dispatchEvent(new CustomEvent('courseUpdated', {
          detail: { action: 'update', course: updatedRecord }
        }));
        
        return updatedRecord;
      }
      
      // Check if offline
      if (!offlineService.isOnline || !offlineService.isServerAvailable) {
        console.log('Offline mode: Saving update operation for later');
        offlineService.saveOperation({
          type: 'update',
          id: id,
          course: updatedCourse
        });
        
        // For UI feedback
        const result = { ...updatedCourse, id };
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('courseUpdated', {
          detail: { action: 'update', course: result }
        }));
        
        return result;
      }
      
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCourse),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update course');
      }
      
      const course = await response.json();
      // Use CustomEvent with details to help components be selective
      window.dispatchEvent(new CustomEvent('courseUpdated', {
        detail: { action: 'update', course }
      }));
      return course;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  deleteCourse: async (id) => {
    try {
      // Use local storage if not using remote backend
      if (!API_CONFIG.useRemoteBackend || !offlineService.isOnline || !offlineService.isServerAvailable) {
        console.log('Using local storage for deleting course');
        
        // Get current courses
        const cachedData = localStorage.getItem('cached_courses');
        let courses = cachedData ? JSON.parse(cachedData) : SAMPLE_COURSES;
        
        // Handle both string and number IDs for comparison
        // Convert to strings for safer comparison
        const courseId = String(id);
        const index = courses.findIndex(c => String(c.id) === courseId);
        
        if (index === -1) {
          console.error(`Course with ID ${id} not found in local storage.`);
          console.log('Available courses:', courses.map(c => c.id));
          throw new Error(`Course not found with ID: ${id}`);
        }
        
        // Store deleted course info before removing
        const deletedCourse = courses[index];
        courses.splice(index, 1);
        
        // Save back to storage
        safelyStoreInLocalStorage('cached_courses', courses);
        
        // Notify UI - include more details to help with rendering updates
        window.dispatchEvent(new CustomEvent('courseUpdated', {
          detail: { 
            action: 'delete', 
            id,
            courseId: courseId, // Include both formats to be safe
            message: `Course deleted: ${deletedCourse.title || 'Unknown'}`
          }
        }));
        
        return true;
      }
      
      // Check if offline
      if (!offlineService.isOnline || !offlineService.isServerAvailable) {
        console.log('Offline mode: Saving delete operation for later');
        offlineService.saveOperation({
          type: 'delete',
          id: id
        });
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('courseUpdated', {
          detail: { action: 'delete', id }
        }));
        
        return true;
      }
      
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete course');
      }
      
      // Dispatch event with detailed info
      window.dispatchEvent(new CustomEvent('courseUpdated', {
        detail: { action: 'delete', id }
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  // Add a diagnostic method to check courses directly
  debugCourses: async () => {
    try {
      if (!API_CONFIG.useRemoteBackend) {
        const cachedData = localStorage.getItem('cached_courses');
        const courses = cachedData ? JSON.parse(cachedData) : SAMPLE_COURSES;
        return {
          count: courses.length,
          ids: courses.map(c => c.id),
          courses: courses
        };
      }
      
      const response = await fetch('/api/debug/courses');
      return await response.json();
    } catch (error) {
      console.error('Debug error:', error);
      return { error: error.message };
    }
  },
  
  // Methods for toggling between local and remote backend
  isUsingRemoteBackend: () => API_CONFIG.useRemoteBackend,
  
  setUseRemoteBackend: (useRemote) => {
    API_CONFIG.useRemoteBackend = useRemote;
    console.log(`API mode set to: ${useRemote ? 'Remote backend' : 'Local data'}`);
    return API_CONFIG.useRemoteBackend;
  },
  
  // Method to update the backend URL (for when moving to VM)
  setBackendUrl: (url) => {
    if (url) {
      API_CONFIG.baseUrl = url;
      console.log(`Backend URL updated to: ${url}`);
      return true;
    }
    return false;
  },

  // Add the missing getOfflineCourses method
  getOfflineCourses: (filters = {}) => {
    try {
      const cachedData = localStorage.getItem('cached_courses');
      let courses = cachedData ? JSON.parse(cachedData) : SAMPLE_COURSES;

      // Apply filters if provided
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        courses = courses.filter(course => 
          course.title.toLowerCase().includes(searchTerm) ||
          course.instructor.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.category && filters.category !== 'All') {
        courses = courses.filter(course => course.category === filters.category);
      }

      return { courses, pagination: null };
    } catch (error) {
      console.error('Error getting offline courses:', error);
      return { courses: SAMPLE_COURSES, pagination: null };
    }
  },
};

// Services for managing courses
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
