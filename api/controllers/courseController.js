const { coursesData } = require('../models/courseModel');
const { defaultImageBase64 } = require('../utils/defaultImage');

// Get all courses with optional filtering and sorting
const getCourses = (req, res) => {
  try {
    // DEBUG: Log the raw courses first
    console.log('Raw courses in database:', coursesData.courses.length, coursesData.courses.map(c => c.id));
    
    // Always return a fresh deep copy to prevent reference issues
    let filteredCourses = JSON.parse(JSON.stringify(coursesData.courses));
    const { search, category, priceMin, priceMax, sortBy } = req.query;
    
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
        case 'price-asc':
          filteredCourses.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filteredCourses.sort((a, b) => b.price - a.price);
          break;
        case 'title-asc':
          filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'title-desc':
          filteredCourses.sort((a, b) => b.title.localeCompare(a.title));
          break;
        case 'rating-asc':
          filteredCourses.sort((a, b) => a.rating - b.rating);
          break;
        case 'rating-desc':
          filteredCourses.sort((a, b) => b.rating - a.rating);
          break;
        default:
          // No sorting
          break;
      }
    }
    
    // Make sure every course has an image
    filteredCourses = filteredCourses.map(course => {
      if (!course.image) {
        course.image = defaultImageBase64;
      }
      return course;
    });
    
    // For debugging
    console.log(`Returning ${filteredCourses.length} courses with IDs: ${filteredCourses.map(c => c.id).join(', ')}`);
    
    // Set explicit no-cache headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json(filteredCourses);
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
    
    // Explicitly broadcast course update through the response headers
    res.setHeader('X-Course-Updated', 'true');
    res.setHeader('X-Course-Id', newCourse.id.toString());
    
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
    
    coursesData.courses.splice(index, 1);
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
