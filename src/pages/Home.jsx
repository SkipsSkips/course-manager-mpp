import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';
import Sidebar from '../components/Sidebar';
import CourseCard from '../components/CourseCard';
import Charts from '../components/Charts';
import { generateMockCourses } from '../utils/generateMockCourses';
import { SimulationContext } from '../App';

const Home = ({ onEdit }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { isSimulationRunning } = useContext(SimulationContext);
  const coursesPerPage = 6;

  const fetchCourses = async () => {
    setLoading(true);
    const data = await courseService.getCourses();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();

    // Simulate real-time updates only if simulation is running
    let updateInterval;
    
    if (isSimulationRunning) {
      updateInterval = setInterval(async () => {
        // Randomly decide the type of update
        const action = Math.random();
        const currentCourses = await courseService.getCourses();

        if (action < 0.4) {
          // Add 1-2 new courses (40% chance)
          const numCoursesToAdd = Math.random() < 0.5 ? 1 : 2;
          const newCourses = generateMockCourses(numCoursesToAdd);
          for (const newCourse of newCourses) {
            await courseService.addCourse(newCourse);
            toast.info(`New course added: ${newCourse.title}`, { autoClose: 3000 });
          }
        } else if (action < 0.7 && currentCourses.length >= 3) {
          // Delete 1-2 random courses (30% chance, if there are at least 3 courses)
          const numCoursesToDelete = Math.random() < 0.5 ? 1 : 2;
          const coursesToDelete = [];
          for (let i = 0; i < numCoursesToDelete && currentCourses.length > 2; i++) {
            const randomIndex = Math.floor(Math.random() * currentCourses.length);
            const courseToDelete = currentCourses[randomIndex];
            if (!coursesToDelete.includes(courseToDelete)) {
              coursesToDelete.push(courseToDelete);
              await courseService.deleteCourse(courseToDelete.id);
              toast.warn(`Course deleted: ${courseToDelete.title}`, { autoClose: 3000 });
            }
            currentCourses.splice(randomIndex, 1); // Remove from local array to avoid re-selecting
          }
        } else if (currentCourses.length > 0) {
          // Update a random course (30% chance, if there are any courses)
          const randomIndex = Math.floor(Math.random() * currentCourses.length);
          const courseToUpdate = currentCourses[randomIndex];
          const updatedCourse = {
            ...courseToUpdate,
            price: parseFloat((courseToUpdate.price + (Math.random() * 20 - 10)).toFixed(2)), // Adjust price by ±$10
            lessons: courseToUpdate.lessons + Math.floor(Math.random() * 5 - 2), // Adjust lessons by ±2
          };
          await courseService.updateCourse(courseToUpdate.id, updatedCourse);
          toast.info(`Course updated: ${courseToUpdate.title}`, { autoClose: 3000 });
        }
      }, 10000); // Increased from 5000 to 10000 to make it slower
    }

    const handleCourseUpdate = () => fetchCourses();
    window.addEventListener('courseUpdated', handleCourseUpdate);

    return () => {
      if (updateInterval) clearInterval(updateInterval);
      window.removeEventListener('courseUpdated', handleCourseUpdate);
    };
  }, [isSimulationRunning]); // Added isSimulationRunning dependency

  const handleSearch = (term) => setSearch(term);
  const handleFilter = (cat) => setCategory(cat);
  const handleSort = (sortOption) => setSort(sortOption);

  // Filter and sort courses
  let filteredCourses = courses
    .filter(course => course.title.toLowerCase().includes(search.toLowerCase()))
    .filter(course => category === 'All' || course.category === category);

  if (sort) {
    filteredCourses.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'lessons-asc') return a.lessons - b.lessons;
      if (sort === 'lessons-desc') return b.lessons - a.lessons;
      if (sort === 'rating-asc') return a.rating - b.rating;
      if (sort === 'rating-desc') return b.rating - a.rating;
      return 0;
    });
  }

  // Calculate price thresholds for highlighting based on filtered courses
  const getPriceHighlight = (coursePrice, allCourses) => {
    if (allCourses.length === 0) return '';

    const prices = allCourses.map(course => course.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Define thresholds for price ranges
    const avgThreshold = 0.3 * avgPrice;
    const lowerAvg = avgPrice - avgThreshold;
    const upperAvg = avgPrice + avgThreshold;
    
    // Low price range (lower 25% of price range)
    const lowThreshold = minPrice + (maxPrice - minPrice) * 0.25;
    
    // High price range (upper 25% of price range)
    const highThreshold = maxPrice - (maxPrice - minPrice) * 0.25;

    if (coursePrice === minPrice) {
      return 'least-expensive'; // Green border
    } else if (coursePrice === maxPrice) {
      return 'most-expensive'; // Red border
    } else if (coursePrice >= lowerAvg && coursePrice <= upperAvg) {
      return 'average-priced'; // Yellow border
    } else if (coursePrice < lowThreshold) {
      return 'least-expensive'; // Green border for low-priced courses
    } else if (coursePrice > highThreshold) {
      return 'most-expensive'; // Red border for high-priced courses
    } else {
      return 'average-priced'; // Yellow border for everything else
    }
  };

  // Pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  if (loading) return <div className="p-8 text-center">Loading courses...</div>;

  return (
    <div className="flex">
      <Sidebar 
        onSearch={handleSearch} 
        onFilter={handleFilter} 
        onSort={handleSort}
        activeCategory={category} 
      />
      <div className="flex-1 md:ml-64 p-8 pt-24 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 sticky top-16 bg-gray-50 z-10">
          Course Listings
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={onEdit}
              onDelete={async (id) => {
                await courseService.deleteCourse(id);
                fetchCourses();
              }}
              highlight={getPriceHighlight(course.price, filteredCourses)}
            />
          ))}
        </div>
        <div className="mt-8 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              } transition-colors`}
            >
              {page}
            </button>
          ))}
        </div>
        <Charts />
      </div>
    </div>
  );
};

export default Home;
