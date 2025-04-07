const express = require('express');
const { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse 
} = require('../controllers/courseController');
const { validateCourse } = require('../middleware/validation');

const router = express.Router();

// GET all courses with optional filtering and sorting
router.get('/', getCourses);

// GET a specific course by ID
router.get('/:id', getCourseById);

// POST a new course with validation
router.post('/', validateCourse, createCourse);

// PUT/update a course with validation
router.put('/:id', validateCourse, updateCourse);

// DELETE a course
router.delete('/:id', deleteCourse);

module.exports = { courseRoutes: router };
