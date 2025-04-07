const { defaultImageBase64 } = require('./defaultImage');
// Use faker like in the frontend
const { faker } = require('@faker-js/faker');

// Some existing categories for consistency
const categories = [
  'Programming', 
  'Design', 
  'Marketing', 
  'Data Science', 
  'Photography', 
  'Health & Fitness', 
  'Music'
];

// Generate a mock course with faker.js
const generateMockCourse = () => {
  const category = faker.helpers.arrayElement(categories);
  
  return {
    title: faker.lorem.words({ min: 2, max: 4 })
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    instructor: `${faker.person.prefix()} ${faker.person.firstName()} ${faker.person.lastName()}`,
    lessons: faker.number.int({ min: 5, max: 30 }),
    duration: `${faker.number.int({ min: 1, max: 8 })}h ${faker.number.int({ min: 0, max: 59 })}m`,
    students: faker.number.int({ min: 50, max: 500 }),
    rating: parseFloat(faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 })),
    price: parseFloat(faker.commerce.price({ min: 19.99, max: 119.99, dec: 2 })),
    category: category,
    image: defaultImageBase64
  };
};

// Generate multiple mock courses
const generateMockCourses = (count) => {
  const courses = [];
  for (let i = 0; i < count; i++) {
    courses.push(generateMockCourse());
  }
  return courses;
};

module.exports = {
  generateMockCourse,
  generateMockCourses
};
