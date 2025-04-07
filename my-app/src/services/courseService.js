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
      console.log(`Received ${data.length} courses from API with IDs:`, data.map(c => c.id));
      return data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  addCourse: async (course) => {
    try {
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
