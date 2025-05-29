import { faker } from '@faker-js/faker';

const categories = ['Programming', 'Design', 'Marketing', 'Data Science', 'Photography', 'Health & Fitness', 'Music'];
const defaultImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzNzNkYyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvdXJzZTwvdGV4dD4KPC9zdmc+';

export const generateMockCourses = (count) => {
  const courses = [];

  for (let i = 0; i < count; i++) {
    courses.push({
      id: faker.number.int({ min: 1000, max: 9999 }), // Unique ID
      title: faker.lorem.words({ min: 2, max: 4 }).split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), // e.g., "Advanced Python Programming"
      instructor: `${faker.person.prefix()} ${faker.person.firstName()} ${faker.person.lastName()}`, // e.g., "Dr. John Doe"
      category: faker.helpers.arrayElement(categories), // Random category
      lessons: faker.number.int({ min: 5, max: 30 }), // Random number of lessons
      students: faker.number.int({ min: 50, max: 500 }), // Random number of students
      price: parseFloat(faker.commerce.price({ min: 19.99, max: 199.99, dec: 2 })), // Random price between 19.99 and 199.99
      rating: parseFloat(faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 })), // Random rating between 3.5 and 5
      image: defaultImageBase64 // Use base64 default image
    });
  }

  return courses;
};
