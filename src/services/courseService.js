import { coursesRepo } from '../data/coursesRepo';
import { defaultImageBase64 } from '../utils/defaultImage';

export const courseService = {
  getCourses: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return coursesRepo;
  },

  addCourse: async (course) => {
    const newCourse = {
      ...course,
      id: coursesRepo.length ? Math.max(...coursesRepo.map(c => c.id)) + 1 : 1,
      // Preserve instructor, students, and rating from the generated course
      instructor: course.instructor || 'Unknown Instructor',
      students: course.students || 0,
      rating: course.rating || 0,
      image: course.image || defaultImageBase64 // Use base64 default image
    };
    coursesRepo.push(newCourse);
    // Dispatch event to notify of data change
    window.dispatchEvent(new Event('courseUpdated'));
    return newCourse;
  },

  updateCourse: async (id, updatedCourse) => {
    const index = coursesRepo.findIndex(course => course.id === id);
    if (index !== -1) {
      // Preserve the image if not provided in update
      if (!updatedCourse.image) {
        updatedCourse.image = coursesRepo[index].image || defaultImageBase64;
      }
      
      coursesRepo[index] = { ...coursesRepo[index], ...updatedCourse };
      // Dispatch event to notify of data change
      window.dispatchEvent(new Event('courseUpdated'));
      return coursesRepo[index];
    }
    throw new Error('Course not found');
  },

  deleteCourse: async (id) => {
    const index = coursesRepo.findIndex(course => course.id === id);
    if (index !== -1) {
      coursesRepo.splice(index, 1);
      // Dispatch event to notify of data change
      window.dispatchEvent(new Event('courseUpdated'));
    }
  },
};
