const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const { coursesData } = require('../models/courseModel');
const { broadcastEvent } = require('../services/eventService');

// Mock dependencies
jest.mock('../services/eventService', () => ({
  broadcastEvent: jest.fn()
}));

// Store original courses for restoration after each test
let originalCourses;

describe('Course Controller', () => {
  // Setup and teardown
  beforeEach(() => {
    // Store original courses and create test data
    originalCourses = [...coursesData.courses];
    coursesData.courses = [
      {
        id: 1,
        title: 'Test Course 1',
        instructor: 'Test Instructor',
        category: 'Programming',
        lessons: 10,
        students: 100,
        price: 49.99,
        rating: 4.5,
        image: 'testImage1'
      },
      {
        id: 2,
        title: 'Advanced JavaScript',
        instructor: 'John Doe',
        category: 'Programming',
        lessons: 15,
        students: 200,
        price: 69.99,
        rating: 4.8,
        image: 'testImage2'
      },
      {
        id: 3,
        title: 'Design Basics',
        instructor: 'Jane Smith',
        category: 'Design',
        lessons: 8,
        students: 150,
        price: 39.99,
        rating: 4.2,
        image: 'testImage3'
      }
    ];
    
    // Reset mock functions
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original courses
    coursesData.courses = originalCourses;
  });

  // GET COURSES TESTS
  describe('getCourses', () => {
    // Test 1: Get all courses without filters
    test('should return all courses without filters', () => {
      const req = {
        query: {}
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      expect(res.setHeader).toHaveBeenCalledTimes(3); // Cache control headers
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        courses: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 }),
          expect.objectContaining({ id: 3 })
        ]),
        pagination: expect.objectContaining({
          totalItems: 3
        })
      }));
    });

    // Test 2: Filter courses by search term
    test('should filter courses by search term', () => {
      const req = {
        query: {
          search: 'javascript'
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        courses: expect.arrayContaining([
          expect.objectContaining({ id: 2, title: 'Advanced JavaScript' })
        ]),
        pagination: expect.objectContaining({
          totalItems: 1
        })
      }));
      expect(res.json.mock.calls[0][0].courses).toHaveLength(1);
    });

    // Test 3: Filter courses by instructor
    test('should filter courses by instructor search', () => {
      const req = {
        query: {
          search: 'john'
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        courses: expect.arrayContaining([
          expect.objectContaining({ id: 2, instructor: 'John Doe' })
        ]),
        pagination: expect.objectContaining({
          totalItems: 1
        })
      }));
    });

    // Test 4: Filter courses by category
    test('should filter courses by category', () => {
      const req = {
        query: {
          category: 'Design'
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        courses: expect.arrayContaining([
          expect.objectContaining({ id: 3, category: 'Design' })
        ]),
        pagination: expect.objectContaining({
          totalItems: 1
        })
      }));
      expect(res.json.mock.calls[0][0].courses).toHaveLength(1);
    });

    // Test 5: Filter courses by price range
    test('should filter courses by price range', () => {
      const req = {
        query: {
          priceMin: 40,
          priceMax: 60
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        courses: expect.arrayContaining([
          expect.objectContaining({ id: 1, price: 49.99 })
        ]),
        pagination: expect.objectContaining({
          totalItems: 1
        })
      }));
      expect(res.json.mock.calls[0][0].courses).toHaveLength(1);
    });

    // Test 6: Sort courses by price (ascending)
    test('should sort courses by price ascending', () => {
      const req = {
        query: {
          sortBy: 'price-asc'
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      // The courses should be in this order: id 3, id 1, id 2
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.courses[0].id).toBe(3);
      expect(responseData.courses[1].id).toBe(1);
      expect(responseData.courses[2].id).toBe(2);
    });

    // Test 7: Sort courses by price (descending)
    test('should sort courses by price descending', () => {
      const req = {
        query: {
          sortBy: 'price-desc'
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      // The courses should be in this order: id 2, id 1, id 3
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.courses[0].id).toBe(2);
      expect(responseData.courses[1].id).toBe(1);
      expect(responseData.courses[2].id).toBe(3);
    });

    // Test 8: Sort courses by title
    test('should sort courses by title', () => {
      const req = {
        query: {
          sortBy: 'title'
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      // The courses should be sorted alphabetically by title
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.courses[0].title).toBe('Advanced JavaScript');
      expect(responseData.courses[1].title).toBe('Design Basics');
      expect(responseData.courses[2].title).toBe('Test Course 1');
    });

    // Test 9: Sort courses by rating
    test('should sort courses by rating', () => {
      const req = {
        query: {
          sortBy: 'rating'
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      // The courses should be sorted by rating (highest first)
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.courses[0].id).toBe(2); // rating 4.8
      expect(responseData.courses[1].id).toBe(1); // rating 4.5
      expect(responseData.courses[2].id).toBe(3); // rating 4.2
    });

    // Test 10: Pagination - first page
    test('should return paginated results - first page', () => {
      const req = {
        query: {
          page: 1,
          limit: 2
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.courses).toHaveLength(2);
      expect(responseData.courses[0].id).toBe(1);
      expect(responseData.courses[1].id).toBe(2);
      expect(responseData.pagination).toEqual(expect.objectContaining({
        page: 1,
        limit: 2,
        totalItems: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false
      }));
    });

    // Test 11: Pagination - second page
    test('should return paginated results - second page', () => {
      const req = {
        query: {
          page: 2,
          limit: 2
        }
      };
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };

      getCourses(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.courses).toHaveLength(1);
      expect(responseData.courses[0].id).toBe(3);
      expect(responseData.pagination).toEqual(expect.objectContaining({
        page: 2,
        limit: 2,
        totalItems: 3,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true
      }));
    });

    // Test 12: Error handling
    test('should handle errors when retrieving courses', () => {
      const req = {
        query: {}
      };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Force an error
      const originalCourses = coursesData.courses;
      coursesData.courses = null;

      getCourses(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error retrieving courses'
      }));

      // Restore courses
      coursesData.courses = originalCourses;
    });
  });

  // GET COURSE BY ID TESTS
  describe('getCourseById', () => {
    // Test 13: Get a course by id
    test('should return a specific course by id', () => {
      const req = {
        params: {
          id: '2'
        }
      };
      const res = {
        json: jest.fn()
      };

      getCourseById(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 2,
        title: 'Advanced JavaScript'
      }));
    });

    // Test 14: Course not found
    test('should return 404 when course is not found', () => {
      const req = {
        params: {
          id: '999'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Course not found'
      }));
    });

    // Test 15: Error handling
    test('should handle errors when retrieving a course by id', () => {
      const req = {
        params: {} // Missing id will cause an error
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      getCourseById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error retrieving course'
      }));
    });
  });

  // CREATE COURSE TESTS
  describe('createCourse', () => {
    // Test 16: Create a new course
    test('should create a new course', () => {
      const newCourse = {
        title: 'New Test Course',
        instructor: 'New Instructor',
        category: 'Testing',
        lessons: 5,
        price: 29.99
      };

      const req = {
        body: newCourse
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      createCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 4, // Should be the next ID after the existing ones
        title: 'New Test Course',
        instructor: 'New Instructor',
        category: 'Testing',
        lessons: 5,
        price: 29.99
      }));
      expect(coursesData.courses).toHaveLength(4);
      expect(broadcastEvent).toHaveBeenCalledWith('courseUpdated', expect.objectContaining({
        action: 'add'
      }));
    });

    // Test 17: Create a course with default values
    test('should set default values when missing optional fields', () => {
      const newCourse = {
        title: 'Minimal Course'
      };

      const req = {
        body: newCourse
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      createCourse(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Minimal Course',
        instructor: 'Unknown Instructor',
        students: 0,
        rating: 0
      }));
    });

    // Test 18: Error handling
    test('should handle errors when creating a course', () => {
      const req = {
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Force an error
      const originalMax = Math.max;
      Math.max = null; // This will cause an error when trying to find the next ID

      createCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error creating course'
      }));

      // Restore Math.max
      Math.max = originalMax;
    });
  });

  // UPDATE COURSE TESTS
  describe('updateCourse', () => {
    // Test 19: Update an existing course
    test('should update an existing course', () => {
      const updatedCourse = {
        title: 'Updated Course Title',
        lessons: 20
      };

      const req = {
        params: {
          id: '2'
        },
        body: updatedCourse
      };
      const res = {
        json: jest.fn()
      };

      updateCourse(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 2,
        title: 'Updated Course Title',
        lessons: 20,
        instructor: 'John Doe', // Original value preserved
      }));
      expect(broadcastEvent).toHaveBeenCalledWith('courseUpdated', expect.objectContaining({
        action: 'update'
      }));
    });

    // Test 20: Update preserves image when not provided
    test('should preserve the image when not provided in update', () => {
      const req = {
        params: {
          id: '1'
        },
        body: {
          title: 'New Title'
        }
      };
      const res = {
        json: jest.fn()
      };

      updateCourse(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        title: 'New Title',
        image: 'testImage1' // Original image preserved
      }));
    });

    // Test 21: Course not found for update
    test('should return 404 when course to update is not found', () => {
      const req = {
        params: {
          id: '999'
        },
        body: {
          title: 'Will Not Update'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      updateCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Course not found'
      }));
    });

    // Test 22: Error handling
    test('should handle errors when updating a course', () => {
      const req = {
        params: {}, // Missing id will cause an error
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      updateCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error updating course'
      }));
    });
  });

  // DELETE COURSE TESTS
  describe('deleteCourse', () => {
    // Test 23: Delete an existing course
    test('should delete an existing course', () => {
      const req = {
        params: {
          id: '2'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      deleteCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(coursesData.courses).toHaveLength(2);
      expect(coursesData.courses.find(c => c.id === 2)).toBeUndefined();
      expect(broadcastEvent).toHaveBeenCalledWith('courseUpdated', expect.objectContaining({
        action: 'delete',
        id: 2
      }));
    });

    // Test 24: Course not found for deletion
    test('should return 404 when course to delete is not found', () => {
      const req = {
        params: {
          id: '999'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      deleteCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Course not found'
      }));
      expect(coursesData.courses).toHaveLength(3); // No deletion occurred
    });

    // Test 25: Error handling
    test('should handle errors when deleting a course', () => {
      const req = {
        params: {} // Missing id will cause an error
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      deleteCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error deleting course'
      }));
      expect(coursesData.courses).toHaveLength(3); // No deletion occurred
    });
  });
});
