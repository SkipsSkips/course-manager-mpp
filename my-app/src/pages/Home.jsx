import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';
import Sidebar from '../components/Sidebar';
import CourseCard from '../components/CourseCard';
import Charts from '../components/Charts';
import { generateMockCourses } from '../utils/generateMockCourses';
import { SimulationContext } from '../App';
import { getCategoryColor } from '../utils/categoryColors';
import { PRICE_THRESHOLDS } from '../utils/constants';

const Home = ({ onEdit }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const { isSimulationRunning, toggleSimulation } = useContext(SimulationContext);
  const coursesPerPage = 6;
  const forceRefreshCounter = useRef(0);
  const isInitialMount = useRef(true);

  const getPriceHighlight = (price, courses) => {
    if (!courses || courses.length <= 1) return null;

    const prices = courses.map(c => c.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    const lowThreshold = min + (max - min) * PRICE_THRESHOLDS.LOW_PERCENTAGE;
    const highThreshold = max - (max - min) * PRICE_THRESHOLDS.HIGH_PERCENTAGE;
    const avgLowerBound = avg * (1 - PRICE_THRESHOLDS.AVERAGE_RANGE);
    const avgUpperBound = avg * (1 + PRICE_THRESHOLDS.AVERAGE_RANGE);

    if (price <= lowThreshold) return 'least-expensive';
    if (price >= highThreshold) return 'most-expensive';
    if (price >= avgLowerBound && price <= avgUpperBound) return 'average-priced';

    return null;
  };

  const debugCourses = async () => {
    const debug = await courseService.debugCourses();
    console.log("DEBUG API Response:", debug);
  };

  const fetchCourses = useCallback(async () => {
    console.log("Fetching courses with refresh counter:", forceRefreshCounter.current);
    setLoading(true);

    try {
      const filters = {
        search,
        category: category !== 'All' ? category : undefined,
        priceMin: priceRange.min,
        priceMax: priceRange.max,
        sortBy: sort,
        forceCacheKey: forceRefreshCounter.current,
        timestamp: Date.now()
      };

      const data = await courseService.getCourses(filters);

      if (Array.isArray(data)) {
        console.log(`Received ${data.length} courses from API:`, data.map(c => c.id));
        setCourses(data);
      } else {
        console.error("Invalid data format returned:", data);
        toast.error("Error: Invalid data returned from server");
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error(`Failed to load courses: ${error.message}`);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, priceRange.min, priceRange.max, sort]);

  useEffect(() => {
    if (isInitialMount.current) {
      fetchCourses();
      isInitialMount.current = false;
    } else {
      fetchCourses();
    }
  }, [fetchCourses]);

  useEffect(() => {
    const handleCourseUpdate = (e) => {
      console.log("Course updated event received", e.detail || {});
      forceRefreshCounter.current += 1;
      fetchCourses();
    };

    window.addEventListener('courseUpdated', handleCourseUpdate);

    return () => {
      window.removeEventListener('courseUpdated', handleCourseUpdate);
    };
  }, [fetchCourses]);

  const handleForceRefresh = () => {
    forceRefreshCounter.current += 1;
    fetchCourses();
    toast.info("Manually refreshing courses...");
  };

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilter = (value) => {
    setCategory(value);
    setCurrentPage(1);
  };

  const handleSort = (value) => {
    setSort(value);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (min, max) => {
    setPriceRange({ min, max });
    setCurrentPage(1);
  };

  const filteredCourses = courses;

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
      <Sidebar 
        onSearch={handleSearch} 
        onFilter={handleFilter} 
        onSort={handleSort}
        onPriceRangeChange={handlePriceRangeChange}
        activeCategory={category} 
      />
      
      <div className="flex-1 md:ml-64 px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex flex-col-reverse md:flex-row md:items-center md:justify-between bg-gray-50 pt-4 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 border-b-2 border-blue-600 inline-block pb-1">
                Course Listings
              </h1>
              <p className="text-gray-600 mt-2">
                Showing {filteredCourses.length} courses {category !== 'All' ? `in ${category}` : ''}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <button
                onClick={handleForceRefresh}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-200 flex items-center shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </button>
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
        
          {isSimulationRunning && (
            <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50 animate-pulse">
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Simulation Running
            </div>
          )}
          
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
          
          <div className="mt-4 mb-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Courses in state: {courses.length}</p>
            <p className="text-sm text-gray-600">Course IDs: {courses.map(c => c.id).join(', ')}</p>
            <p className="text-sm text-gray-600">Refresh counter: {forceRefreshCounter.current}</p>
          </div>
          
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
