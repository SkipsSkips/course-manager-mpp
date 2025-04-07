// In-memory course repository
const coursesData = {
  courses: [
    // Initial sample data for when repo import fails
    {
      id: 1,
      title: "Introduction to Web Development",
      instructor: "John Doe",
      category: "Programming",
      lessons: 12,
      students: 245,
      price: 49.99,
      rating: 4.8,
      image: null
    },
    {
      id: 2,
      title: "Machine Learning Basics",
      instructor: "Jane Smith",
      category: "Data Science",
      lessons: 15,
      students: 189,
      price: 59.99,
      rating: 4.6,
      image: null
    }
  ]
};

// Try to import from existing coursesRepo but don't fail if it doesn't exist
try {
  const { coursesRepo } = require('../../my-app/src/data/coursesRepo');
  if (Array.isArray(coursesRepo) && coursesRepo.length > 0) {
    coursesData.courses = [...coursesRepo];
    console.log('Loaded existing courses repository');
  }
} catch (error) {
  console.log('Using default sample courses');
}

module.exports = { coursesData };
