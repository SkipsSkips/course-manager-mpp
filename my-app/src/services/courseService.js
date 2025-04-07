import offlineService from './offlineService';

export const courseService = {
  getCourses: async (filters = {}) => {
    try {
      // Convert filters object to query string
      const queryParams = new URLSearchParams();
      
      // Add all filters to the query string
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
      
      // ALWAYS include a random number to bust cache
      queryParams.append('_nocache', Math.random());
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      console.log(`Fetching courses with query: ${query}`);
      
      // Check if we're offline or server is unavailable
      if (!offlineService.isOnline || !offlineService.isServerAvailable) {
        console.log('Offline mode: Using local storage data');
        return courseService.getOfflineCourses(filters);
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
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      
      // Handle new response format that includes pagination
      const courses = data.courses || data;
      const pagination = data.pagination || null;
      
      console.log(`Received ${courses.length} courses from API with IDs:`, courses.map(c => c.id));
      
      // Store courses in localStorage for offline use
      localStorage.setItem('cached_courses', JSON.stringify(courses));
      
      // Return the data in a format compatible with the rest of the application
      return data;
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
      if (!cachedData) {
        return [];
      }
      
      let courses = JSON.parse(cachedData);
      
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
      
      // Apply sorting
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
        }
      }
      
      return courses;
    } catch (error) {
      console.error('Error getting offline courses:', error);
      return [];
    }
  },

  addCourse: async (course) => {
    try {
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
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  // Add a diagnostic method to check courses directly
  debugCourses: async () => {
    try {
      const response = await fetch('/api/debug/courses');
      return await response.json();
    } catch (error) {
      console.error('Debug error:', error);
      return { error: error.message };
    }
  }
};
