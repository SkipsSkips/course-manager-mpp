const models = require('../models');
const { coursesData } = require('../models/courseModel');
const { defaultImageBase64 } = require('../utils/defaultImage');
const { broadcastEvent } = require('../services/eventService');
const databaseService = require('../services/databaseService');
const { Op } = require('sequelize');

// Helper function to determine if we should use database
const useDatabase = () => {
  return process.env.USE_DATABASE === 'true' && databaseService.isReady();
};

// Get all courses with optional filtering, sorting, and pagination
const getCourses = async (req, res) => {
  try {
    if (useDatabase()) {
      return await getCoursesFromDatabase(req, res);
    } else {
      return getCoursesFromMemory(req, res);
    }
  } catch (error) {
    console.error('Error in getCourses:', error);
    res.status(500).json({ message: 'Error retrieving courses', error: error.message });
  }
};

// Database implementation
const getCoursesFromDatabase = async (req, res) => {
  const { search, category, priceMin, priceMax, sortBy, page, limit } = req.query;
  
  // Build where clause
  const whereClause = { isActive: true };
  
  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { '$instructor.name$': { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  if (priceMin !== undefined) {
    whereClause.price = { ...whereClause.price, [Op.gte]: parseFloat(priceMin) };
  }
  
  if (priceMax !== undefined) {
    whereClause.price = { ...whereClause.price, [Op.lte]: parseFloat(priceMax) };
  }

  // Build include clause for category filter
  const includeClause = [
    {
      model: models.Category,
      as: 'category',
      attributes: ['id', 'name']
    },
    {
      model: models.Instructor,
      as: 'instructor',
      attributes: ['id', 'name', 'email', 'rating']
    }
  ];

  if (category && category !== 'All') {
    includeClause[0].where = { name: category };
  }

  // Build order clause
  let orderClause = [['createdAt', 'DESC']];
  if (sortBy) {
    switch (sortBy) {
      case 'title':
        orderClause = [['title', 'ASC']];
        break;
      case 'price-asc':
        orderClause = [['price', 'ASC']];
        break;
      case 'price-desc':
        orderClause = [['price', 'DESC']];
        break;
      case 'rating':
        orderClause = [['rating', 'DESC']];
        break;
    }
  }

  // Pagination - return ALL courses by default, no artificial limits
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || null; // No default limit - return all
  const offset = pageSize ? (pageNum - 1) * pageSize : 0;

  const queryOptions = {
    where: whereClause,
    include: includeClause,
    order: orderClause,
    distinct: true
  };

  // Only add pagination if explicitly requested
  if (pageSize) {
    queryOptions.limit = pageSize;
    queryOptions.offset = offset;
  }

  const { count, rows: courses } = await models.Course.findAndCountAll(queryOptions);

  // Transform data to match frontend expectations
  const transformedCourses = courses.map(course => ({
    id: course.id,
    title: course.title,
    instructor: course.instructor.name,
    lessons: course.lessons,
    duration: course.duration,
    students: course.students,
    rating: parseFloat(course.rating),
    price: parseFloat(course.price),
    category: course.category.name,
    image: course.image || defaultImageBase64
  }));

  const pagination = {
    page: pageNum,
    limit: pageSize || count, // Use total count if no limit
    totalItems: count,
    totalPages: pageSize ? Math.ceil(count / pageSize) : 1,
    hasNextPage: pageSize ? (offset + pageSize < count) : false,
    hasPrevPage: pageNum > 1
  };

  console.log(`Returning ${transformedCourses.length} courses from database (filtered from ${count} total)`);

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.json({
    courses: transformedCourses,
    pagination
  });
};

// In-memory implementation (fallback)
const getCoursesFromMemory = (req, res) => {
  console.log('Raw courses:', coursesData.courses.length, coursesData.courses.map(c => c.id));
  
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
        break;
    }
  }
  
  const totalItems = filteredCourses.length;
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || totalItems; // Return all by default
  
  const startIndex = (pageNum - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);
  
  const coursesWithImages = paginatedCourses.map(course => {
    if (!course.image) {
      course.image = defaultImageBase64;
    }
    return course;
  });
  
  const pagination = {
    page: pageNum,
    limit: pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
    hasNextPage: endIndex < totalItems,
    hasPrevPage: pageNum > 1
  };
  
  console.log(`Returning ${coursesWithImages.length} courses from memory`);
  
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.json({
    courses: coursesWithImages,
    pagination
  });
};

// Create a new course
const createCourse = async (req, res) => {
  try {
    const courseData = req.body;
    console.log('Creating new course:', courseData);
    
    // Calculate duration if hours and minutes are provided but duration is not
    if (!courseData.duration && (courseData.hours || courseData.minutes)) {
      const hours = parseInt(courseData.hours) || 0;
      const minutes = parseInt(courseData.minutes) || 0;
      courseData.duration = `${hours}h ${minutes}m`;
    }
    
    // Provide default duration if none specified
    if (!courseData.duration) {
      courseData.duration = "1h 0m";
    }
    
    if (useDatabase()) {
      // Find or create category
      const [category] = await models.Category.findOrCreate({
        where: { name: courseData.category },
        defaults: {
          name: courseData.category,
          description: `Courses related to ${courseData.category}`,
          isActive: true
        }
      });
      
      // Find or create instructor
      const instructorName = courseData.instructor || 'Default Instructor';
      const [instructor] = await models.Instructor.findOrCreate({
        where: { name: instructorName },
        defaults: {
          name: instructorName,
          email: `${instructorName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          expertise: [courseData.category],
          rating: 4.5,
          isActive: true
        }
      });
      
      const newCourse = await models.Course.create({
        title: courseData.title,
        lessons: courseData.lessons,
        duration: courseData.duration,
        students: courseData.students || 0,
        rating: courseData.rating || 0,
        price: courseData.price,
        image: courseData.image || defaultImageBase64,
        categoryId: category.id,
        instructorId: instructor.id,
        isActive: true
      });
      
      // Fetch the created course with associations
      const createdCourse = await models.Course.findByPk(newCourse.id, {
        include: [
          { model: models.Category, as: 'category' },
          { model: models.Instructor, as: 'instructor' }
        ]
      });
      
      const transformedCourse = {
        id: createdCourse.id,
        title: createdCourse.title,
        instructor: createdCourse.instructor.name,
        lessons: createdCourse.lessons,
        duration: createdCourse.duration,
        students: createdCourse.students,
        rating: parseFloat(createdCourse.rating),
        price: parseFloat(createdCourse.price),
        category: createdCourse.category.name,
        image: createdCourse.image
      };
      
      console.log('Broadcasting course creation event:', transformedCourse);
      
      broadcastEvent('courseUpdated', {
        action: 'add',
        course: transformedCourse,
        message: `New course added: ${transformedCourse.title}`,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json(transformedCourse);
    } else {
      // ...existing code... (in-memory implementation)
      const newCourse = {
        ...courseData,
        id: coursesData.courses.length ? Math.max(...coursesData.courses.map(c => c.id)) + 1 : 1,
        instructor: courseData.instructor || 'Unknown Instructor',
        students: courseData.students || 0,
        rating: courseData.rating || 0,
        image: courseData.image || defaultImageBase64,
        duration: courseData.duration
      };
      
      coursesData.courses.push(newCourse);
      
      broadcastEvent('courseUpdated', {
        action: 'add',
        course: newCourse,
        message: `New course added: ${newCourse.title}`
      });
      
      console.log(`Added course with ID ${newCourse.id}, total courses: ${coursesData.courses.length}`);
      res.status(201).json(newCourse);
    }
  } catch (error) {
    console.error('Error in createCourse:', error);
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
};

// Get a specific course by ID
const getCourseById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (useDatabase()) {
      const course = await models.Course.findByPk(id, {
        include: [
          { model: models.Category, as: 'category' },
          { model: models.Instructor, as: 'instructor' }
        ]
      });
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      const transformedCourse = {
        id: course.id,
        title: course.title,
        instructor: course.instructor.name,
        lessons: course.lessons,
        duration: course.duration,
        students: course.students,
        rating: parseFloat(course.rating),
        price: parseFloat(course.price),
        category: course.category.name,
        image: course.image || defaultImageBase64
      };
      
      res.json(transformedCourse);
    } else {
      const course = coursesData.courses.find(c => c.id === id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json(course);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving course', error: error.message });
  }
};

// Update a course
const updateCourse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedCourseData = req.body;
    const userId = req.user?.id;
    
    if (useDatabase()) {
      const course = await models.Course.findByPk(id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Handle category update
      if (updatedCourseData.category) {
        const [category] = await models.Category.findOrCreate({
          where: { name: updatedCourseData.category },
          defaults: {
            name: updatedCourseData.category,
            description: `Courses related to ${updatedCourseData.category}`,
            isActive: true
          }
        });
        updatedCourseData.categoryId = category.id;
        delete updatedCourseData.category;
      }
      
      // Handle instructor update
      if (updatedCourseData.instructor) {
        const instructorName = updatedCourseData.instructor;
        const [instructor] = await models.Instructor.findOrCreate({
          where: { name: instructorName },
          defaults: {
            name: instructorName,
            email: `${instructorName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            rating: 4.5,
            isActive: true
          }
        });
        updatedCourseData.instructorId = instructor.id;
        delete updatedCourseData.instructor;
      }
      
      await course.update(updatedCourseData);
      
      // Fetch updated course with associations
      const updatedCourse = await models.Course.findByPk(id, {
        include: [
          { model: models.Category, as: 'category' },
          { model: models.Instructor, as: 'instructor' }
        ]
      });
      
      const transformedCourse = {
        id: updatedCourse.id,
        title: updatedCourse.title,
        instructor: updatedCourse.instructor.name,
        lessons: updatedCourse.lessons,
        duration: updatedCourse.duration,
        students: updatedCourse.students,
        rating: parseFloat(updatedCourse.rating),
        price: parseFloat(updatedCourse.price),
        category: updatedCourse.category.name,
        image: updatedCourse.image
      };
      
      broadcastEvent('courseUpdated', {
        action: 'update',
        course: transformedCourse,
        message: `Course updated: ${transformedCourse.title}`
      });
      
      res.json(transformedCourse);
    } else {
      // ...existing code... (in-memory implementation)
      const index = coursesData.courses.findIndex(c => c.id === id);
      
      if (index === -1) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      if (!updatedCourseData.image) {
        updatedCourseData.image = coursesData.courses[index].image || defaultImageBase64;
      }
      
      coursesData.courses[index] = { 
        ...coursesData.courses[index], 
        ...updatedCourseData,
        id
      };
      
      broadcastEvent('courseUpdated', {
        action: 'update',
        course: coursesData.courses[index],
        message: `Course updated: ${coursesData.courses[index].title}`
      });
      
      res.json(coursesData.courses[index]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating course', error: error.message });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (useDatabase()) {
      const course = await models.Course.findByPk(id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      await course.update({ isActive: false }); // Soft delete
      
      broadcastEvent('courseUpdated', {
        action: 'delete',
        id,
        message: `Course deleted: ${course.title}`
      });
      
      res.status(204).send();
    } else {
      // ...existing code... (in-memory implementation)
      const index = coursesData.courses.findIndex(c => c.id === id);
      
      if (index === -1) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      const deletedCourse = coursesData.courses[index];
      coursesData.courses.splice(index, 1);
      
      broadcastEvent('courseUpdated', {
        action: 'delete',
        id,
        message: `Course deleted: ${deletedCourse.title}`
      });
      
      res.status(204).send();
    }
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
