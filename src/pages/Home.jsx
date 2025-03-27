import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';
import Sidebar from '../components/Sidebar';
import CourseCard from '../components/CourseCard';
import Charts from '../components/Charts';
import { generateMockCourses } from '../utils/generateMockCourses';
import { SimulationContext } from '../App';
import { getCategoryColor } from '../utils/categoryColors';

const Home = ({ onEdit }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  // Fix: Destructure toggleSimulation from context
  const { isSimulationRunning, toggleSimulation } = useContext(SimulationContext);
  const coursesPerPage = 6;

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
      setCourses([]); // Fallback
    } finally {
      setLoading(false);
    }
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
  const handlePriceRangeChange = (range) => {
    setPriceRange(range);
  };

  // Use React.useMemo for expensive operations like filtering and sorting
  const filteredCourses = React.useMemo(() => {
    let result = courses
      .filter(course => course.title.toLowerCase().includes(search.toLowerCase()))
      .filter(course => category === 'All' || course.category === category)
      .filter(course => course.price >= priceRange.min && course.price <= priceRange.max);
      
    if (sort) {
      return [...result].sort((a, b) => {
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'price-desc') return b.price - a.price;
        if (sort === 'lessons-asc') return a.lessons - b.lessons;
        if (sort === 'lessons-desc') return b.lessons - a.lessons;
        if (sort === 'rating-asc') return a.rating - b.rating;
        if (sort === 'rating-desc') return b.rating - a.rating;
        return 0;
      });
    }
    
    return result;
  }, [courses, search, category, sort, priceRange]);

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

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      <span className="ml-4 text-xl font-semibold text-gray-700">Loading courses...</span>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        onSearch={handleSearch} 
        onFilter={handleFilter} 
        onSort={handleSort}
        onPriceRangeChange={handlePriceRangeChange}
        activeCategory={category} 
      />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-64 px-4 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header with Actions - Remove sticky positioning */}
          <header className="mb-8 flex flex-col-reverse md:flex-row md:items-center md:justify-between bg-gray-50 pt-4 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 border-b-2 border-blue-600 inline-block pb-1">
                Course Listings
              </h1>
              <p className="text-gray-600 mt-2">
                Showing {filteredCourses.length} courses {category !== 'All' ? `in ${category}` : ''}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <Link 
                to="/add" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Course
              </Link>
              <button 
                onClick={toggleSimulation} 
                className={`px-4 py-2 rounded-lg flex items-center shadow-md ${
                  isSimulationRunning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isSimulationRunning ? (
                  <>
                    <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Stop Simulation
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Start Simulation
                  </>
                )}
              </button>
            </div>
          </header>
        
          {/* Show simulation status indicator if simulation is running */}
          {isSimulationRunning && (
            <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50 animate-pulse">
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Simulation Running
            </div>
          )}
          
          {/* Course Cards with enhanced grid layout */}
          {currentCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {currentCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={onEdit}
                  onDelete={async (id) => {
                    await courseService.deleteCourse(id);
                    fetchCourses();
                    toast.success('Course deleted successfully!');
                  }}
                  highlight={getPriceHighlight(course.price, filteredCourses)}
                  categoryColor={getCategoryColor(course.category)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No courses found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 mb-10 flex justify-center">
              <div className="flex space-x-2 shadow-md rounded-lg overflow-hidden">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 ${
                      currentPage === page ? 'bg-blue-600 text-white font-semibold' : 'bg-white text-gray-700 hover:bg-gray-100'
                    } transition-colors border-r border-gray-200 last:border-r-0`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Charts Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Analytics</h2>
            <Charts />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
