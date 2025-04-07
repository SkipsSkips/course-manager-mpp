// In-memory course repository
const { defaultImageBase64 } = require('../utils/defaultImage');

const coursesData = {
  courses: [
    // Programming
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
      image: defaultImageBase64
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
      image: defaultImageBase64
    },
    {
      id: 3,
      title: "React Fundamentals",
      instructor: "Michael Chen",
      lessons: 14,
      duration: "5h 45m",
      students: 275,
      rating: 4.7,
      price: 59.99,
      category: "Programming",
      image: defaultImageBase64
    },
    // Design
    {
      id: 4,
      title: "UI/UX Design Basics",
      instructor: "Jane Smith",
      lessons: 8,
      duration: "3h 15m",
      students: 187,
      rating: 4.6,
      price: 39.99,
      category: "Design",
      image: defaultImageBase64
    },
    // Marketing
    {
      id: 5,
      title: "Digital Marketing 101",
      instructor: "Sarah Johnson",
      lessons: 10,
      duration: "3h 0m",
      students: 320,
      rating: 4.7,
      price: 59.99,
      category: "Marketing",
      image: defaultImageBase64
    },
    // Data Science
    {
      id: 6,
      title: "Machine Learning Basics",
      instructor: "Dr. Robert Lee",
      lessons: 15,
      duration: "6h 0m",
      students: 189,
      rating: 4.6,
      price: 79.99,
      category: "Data Science",
      image: defaultImageBase64
    },
    // Photography
    {
      id: 7,
      title: "Photography for Beginners",
      instructor: "Chris Evans",
      lessons: 10,
      duration: "3h 0m",
      students: 180,
      rating: 4.5,
      price: 39.99,
      category: "Photography",
      image: defaultImageBase64
    },
    // Health & Fitness
    {
      id: 8,
      title: "Yoga for Beginners",
      instructor: "Rachel Green",
      lessons: 10,
      duration: "3h 0m",
      students: 250,
      rating: 4.6,
      price: 39.99,
      category: "Health & Fitness",
      image: defaultImageBase64
    },
    // Music
    {
      id: 9,
      title: "Guitar for Beginners",
      instructor: "Ben Taylor",
      lessons: 10,
      duration: "3h 0m",
      students: 200,
      rating: 4.5,
      price: 39.99,
      category: "Music",
      image: defaultImageBase64
    },
  ]
};

// Export the data
module.exports = { coursesData };
