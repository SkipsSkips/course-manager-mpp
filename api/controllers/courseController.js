const { coursesData } = require('../models/courseModel');
const { defaultImageBase64 } = require('../utils/defaultImage');
const { broadcastEvent } = require('../services/eventService'); // This creates a circular dependency, but we'll fix it

// Get all courses with optional filtering, sorting, and pagination
const getCourses = (req, res) => {
  try {
    // DEBUG: Log the raw courses first
    console.log('Raw courses in database:', coursesData.courses.length, coursesData.courses.map(c => c.id));
    
    // Always return a fresh deep copy to prevent reference issues
    let filteredCourses = JSON.parse(JSON.stringify(coursesData.courses));
    const { search, category, priceMin, priceMax, sortBy, page, limit } = req.query;
    
    // Apply filters
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCourses = filteredCourses.filter(
        course => course.title.toLowerCase().includes(searchTerm) || 
                 (course.instructor && course.instructor.toLowerCase().includes(searchTerm))
      );
    }
    
    if (category && category !== 'All') {
      filteredCourses = filteredCourses.filter(
        course => course.category === category
      );
    }
    
    if (priceMin !== undefined) {
      filteredCourses = filteredCourses.filter(
        course => course.price >= parseFloat(priceMin)
      );
    }
    
    if (priceMax !== undefined) {
      filteredCourses = filteredCourses.filter(
        course => course.price <= parseFloat(priceMax)
      );
    }
    
    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'title':
          filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'price-asc':
          filteredCourses.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filteredCourses.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filteredCourses.sort((a, b) => b.rating - a.rating);
          break;
        default:
          // No sorting
          break;
      }
    }
    
    // Create pagination metadata
    const totalItems = filteredCourses.length;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || totalItems; // Default to all items if no limit
    
    // Apply pagination
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);
    
    // Make sure every course has an image
    const coursesWithImages = paginatedCourses.map(course => {
      if (!course.image) {
        course.image = defaultImageBase64;
      }
      return course;
    });
    
    // Prepare pagination metadata
    const pagination = {
      page: pageNum,
      limit: pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      hasNextPage: endIndex < totalItems,
      hasPrevPage: pageNum > 1
    };
    
    // For debugging
    console.log(`Returning ${coursesWithImages.length} courses with IDs: ${coursesWithImages.map(c => c.id).join(', ')}`);
    
    // Set explicit no-cache headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Return both courses and pagination info
    res.json({
      courses: coursesWithImages,
      pagination
    });
  } catch (error) {
    console.error('Error in getCourses:', error);
    res.status(500).json({ message: 'Error retrieving courses', error: error.message });
  }
};

// Get a specific course by ID
const getCourseById = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const course = coursesData.courses.find(c => c.id === id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving course', error: error.message });
  }
};

// Create a new course
const createCourse = (req, res) => {
  try {
    const course = req.body;
    console.log('Creating new course:', course);
    
    const newCourse = {
      ...course,
      id: coursesData.courses.length ? Math.max(...coursesData.courses.map(c => c.id)) + 1 : 1,
      instructor: course.instructor || 'Unknown Instructor',
      students: course.students || 0,
      rating: course.rating || 0,
      image: course.image || defaultImageBase64
    };
    
    coursesData.courses.push(newCourse);
    
    // Broadcast the event to all connected clients
    broadcastEvent('courseUpdated', {
      action: 'add',
      course: newCourse,
      message: `New course added: ${newCourse.title}`
    });
    
    console.log(`Added course with ID ${newCourse.id}, total courses: ${coursesData.courses.length}, all IDs: ${coursesData.courses.map(c => c.id).join(',')}`);
    
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error in createCourse:', error);
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
};

// Update a course
const updateCourse = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedCourse = req.body;
    
    const index = coursesData.courses.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Preserve the image if not provided in update
    if (!updatedCourse.image) {
      updatedCourse.image = coursesData.courses[index].image || defaultImageBase64;
    }
    
    // Update course while preserving the ID
    coursesData.courses[index] = { 
      ...coursesData.courses[index], 
      ...updatedCourse,
      id // Ensure ID doesn't change
    };
    
    // Broadcast the event to all connected clients
    broadcastEvent('courseUpdated', {
      action: 'update',
      course: coursesData.courses[index],
      message: `Course updated: ${coursesData.courses[index].title}`
    });
    
    res.json(coursesData.courses[index]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating course', error: error.message });
  }
};

// Delete a course
const deleteCourse = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = coursesData.courses.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const deletedCourse = coursesData.courses[index];
    coursesData.courses.splice(index, 1);
    
    // Broadcast the event to all connected clients
    broadcastEvent('courseUpdated', {
      action: 'delete',
      id,
      message: `Course deleted: ${deletedCourse.title}`
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
