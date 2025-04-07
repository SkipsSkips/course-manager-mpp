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
      // Convert filters object to query string
      const queryParams = new URLSearchParams();
      
      // Add all filters to the query string - properly convert objects to primitive values
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          // Special handling for priceMin and priceMax to make sure they're numbers
          if (key === 'priceMin' || key === 'priceMax') {
            // Make sure it's a number before adding to query
            if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
              queryParams.append(key, Number(value));
            }
          } 
          // Handle object values - prevent [object Object] in URL
          else if (typeof value === 'object' && value !== null) {
            if (key === 'timestamp' || key === 'forceCacheKey') {
              queryParams.append(key, value.toString());
            }
            // Skip objects that shouldn't be in the URL
          } 
          // Normal case - add the value directly
          else {
            queryParams.append(key, value);
          }
        }
      });
      
      // Use local data if not using remote backend or server unavailable
      if (!API_CONFIG.useRemoteBackend || !offlineService.isOnline || !offlineService.isServerAvailable) {
        console.log('Using local data for courses');
        const allCourses = courseService.getOfflineCourses(filters);
        
        // Apply pagination manually for local data
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || allCourses.length;
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, allCourses.length);
        
        const paginatedCourses = allCourses.slice(startIndex, endIndex);
        
        // Format response like the API would
        const pagination = {
          page: page,
          limit: limit,
          totalItems: allCourses.length,
          totalPages: Math.ceil(allCourses.length / limit),
          hasNextPage: endIndex < allCourses.length,
          hasPrevPage: page > 1
        };
        
        console.log(`Paginated ${allCourses.length} courses to ${paginatedCourses.length} courses. Page ${page}/${Math.ceil(allCourses.length / limit)}`);
        
        return { courses: paginatedCourses, pagination };
      }
      
      // ALWAYS include a random number to bust cache
      queryParams.append('_nocache', Math.random());
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      console.log(`Fetching courses with query: ${query}`);
      
      // Check if we're offline or server is unavailable
      if (!offlineService.isOnline || !offlineService.isServerAvailable) {
        console.log('Offline mode: Using local storage data');
        return { 
          courses: courseService.getOfflineCourses(filters),
          pagination: {
            page: parseInt(filters.page) || 1,
            limit: parseInt(filters.limit) || 10,
            totalItems: courseService.getOfflineCourses().length,
            totalPages: Math.ceil(courseService.getOfflineCourses().length / (parseInt(filters.limit) || 10))
          }
        };
      }
      
      const response = await fetch(`/api/courses${query}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        // Force reload from server, not cache
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle new response format that includes pagination
      const courses = data.courses || data;
      const pagination = data.pagination || null;
      
      if (!Array.isArray(courses)) {
        console.error('Received non-array courses data:', courses);
        return { courses: [], pagination: null };
      }
      
      console.log(`Received ${courses.length} courses from API with IDs:`, courses.map(c => c.id));
      
      // Store courses in localStorage with image stripping to reduce size
      safelyStoreInLocalStorage('cached_courses', courses);
      
      // Return the data in a format compatible with the rest of the application
      return { courses, pagination };
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      // If fetch fails, we might be offline - try to use cached data
      return courseService.getOfflineCourses(filters);
    }
  },

  // Get courses from local storage when offline
  getOfflineCourses: (filters = {}) => {
    try {
      const cachedData = localStorage.getItem('cached_courses');
      let courses = [];
      
      if (cachedData) {
        try {
          courses = JSON.parse(cachedData);
          if (!Array.isArray(courses)) {
            console.error('Cached courses is not an array:', courses);
            courses = SAMPLE_COURSES;
          }
        } catch (e) {
          console.error('Error parsing cached courses:', e);
          courses = SAMPLE_COURSES;
        }
      } else {
        // If no cached data exists, use sample courses
        courses = SAMPLE_COURSES;
        
        // Store the sample courses if nothing exists
        safelyStoreInLocalStorage('cached_courses', courses);
      }
      
      // Make a copy of courses to avoid reference issues
      courses = JSON.parse(JSON.stringify(courses));
      
      // Apply pending operations to local data
      const operations = offlineService.getOfflineOperations();
      
      operations.forEach(op => {
        switch (op.type) {
          case 'add':
            // Add a temporary ID if needed
            if (!op.course.id) {
              op.course.id = `temp_${new Date().getTime()}`;
            }
            courses.push(op.course);
            break;
          case 'update':
            const updateIndex = courses.findIndex(c => c.id === op.id);
            if (updateIndex !== -1) {
              courses[updateIndex] = { ...courses[updateIndex], ...op.course };
            }
            break;
          case 'delete':
            courses = courses.filter(c => c.id !== op.id);
            break;
          default:
            console.log(`Unknown operation type: ${op.type}`);
            break;
        }
      });
      
      // Apply filters in the same way the server would
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        courses = courses.filter(
          course => course.title.toLowerCase().includes(searchTerm) || 
                   (course.instructor && course.instructor.toLowerCase().includes(searchTerm))
        );
      }
      
      if (filters.category && filters.category !== 'All') {
        courses = courses.filter(
          course => course.category === filters.category
        );
      }
      
      if (filters.priceMin !== undefined) {
        courses = courses.filter(
          course => course.price >= parseFloat(filters.priceMin)
        );
      }
      
      if (filters.priceMax !== undefined) {
        courses = courses.filter(
          course => course.price <= parseFloat(filters.priceMax)
        );
      }
      
      // Apply sorting with default case
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'title':
            courses.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 'price-asc':
            courses.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            courses.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            courses.sort((a, b) => b.rating - a.rating);
            break;
          default:
            // No sorting for unknown sort types
            console.log(`Unknown sort type: ${filters.sortBy}`);
            break;
        }
      }
      
      // If pagination is requested, return paginated data
      if (filters.page !== undefined || filters.limit !== undefined) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, courses.length);
        
        // Get paginated slice of data - make absolutely sure courses is an array
        const paginatedCourses = Array.isArray(courses) ? courses.slice(startIndex, endIndex) : [];
        
        // Prepare pagination metadata
        const pagination = {
          page: page,
          limit: limit,
          totalItems: courses.length,
          totalPages: Math.ceil(courses.length / limit)
        };
        
        console.log(`Offline pagination: page ${page}/${pagination.totalPages}, showing ${paginatedCourses.length} of ${courses.length} courses`);
        
        return {
          courses: paginatedCourses, 
          pagination: pagination
        };
      }
      
      // If no pagination requested, return all filtered courses
      return { 
        courses,
        pagination: {
          page: 1,
          limit: courses.length,
          totalItems: courses.length,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Error getting offline courses:', error);
      return { 
        courses: SAMPLE_COURSES,
        pagination: {
          page: 1,
          limit: SAMPLE_COURSES.length,
          totalItems: SAMPLE_COURSES.length,
          totalPages: 1
        }
      };
    }
  },

  addCourse: async (course) => {
    try {
      // Use local storage if not using remote backend
      if (!API_CONFIG.useRemoteBackend || !offlineService.isOnline || !offlineService.isServerAvailable) {
        console.log('Using local storage for adding course');
        
        // Get current courses from storage
        const cachedData = localStorage.getItem('cached_courses');
        let courses = cachedData ? JSON.parse(cachedData) : SAMPLE_COURSES;
        
        // Find highest ID and increment by 1
        const highestId = Math.max(...courses.map(c => typeof c.id === 'number' ? c.id : 0), 0);
        const newId = highestId + 1;
        
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
        
        // Notify UI
        window.dispatchEvent(new CustomEvent('courseUpdated', {
          detail: { action: 'add', course: newCourse }
        }));
        
        return newCourse;
      }
      
      // Check if we're online and server is available
      if (!offlineService.isOnline || !offlineService.isServerAvailable) {
        console.log('Offline mode: Saving add operation for later');
        offlineService.saveOperation({
          type: 'add',
          course: course
        });
        
        // Generate a temporary ID for the UI to work properly
        const tempCourse = {
          ...course,
          id: `temp_${new Date().getTime()}`
        };
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('courseUpdated', {
          detail: { action: 'add', course: tempCourse }
        }));
        
        return tempCourse;
      }
      
      console.log('Adding course:', course);
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(course),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add course');
      }
      
      const newCourse = await response.json();
      console.log('Course added successfully:', newCourse);
      
      // Dispatch only one event with detailed info
      window.dispatchEvent(new CustomEvent('courseUpdated', {
        detail: { action: 'add', course: newCourse }
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
  }
};
