import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';
import Sidebar from '../components/Sidebar';
import CourseCard from '../components/CourseCard';
import Charts from '../components/Charts';
import { SimulationContext } from '../App';
import { getCategoryColor } from '../utils/categoryColors';
import { PRICE_THRESHOLDS } from '../utils/constants';
import offlineService, { RECONNECTION_INTERVAL } from '../services/offlineService';

const Home = ({ onEdit }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const { isSimulationRunning, toggleSimulation } = useContext(SimulationContext);
  const forceRefreshCounter = useRef(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(6); // Smaller default page size (changed from 10)
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isReconnecting, setIsReconnecting] = useState(false);

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

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    // Reset to first page when changing items per page, but don't trigger a separate fetch
    setCurrentPage(1);
  };

  // Separate useEffect for handling currentPage and itemsPerPage changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const filters = {
          search,
          category: category !== 'All' ? category : undefined,
          priceMin: priceRange.min,
          priceMax: priceRange.max,
          sortBy: sort,
          page: currentPage,
          limit: itemsPerPage,
          forceCacheKey: forceRefreshCounter.current,
          timestamp: Date.now()
        };

        const response = await courseService.getCourses(filters);

        if (response && response.courses && Array.isArray(response.courses)) {
          console.log(`Received ${response.courses.length} courses from API:`, response.courses.map(c => c.id));
          setCourses(response.courses);
          
          // Update pagination info
          if (response.pagination) {
            setTotalItems(response.pagination.totalItems);
            setTotalPages(response.pagination.totalPages);
            console.log(`Setting total pages: ${response.pagination.totalPages}, total items: ${response.pagination.totalItems}`);
          } else {
            // If no pagination info, assume all courses are returned
            setTotalItems(response.courses.length);
            setTotalPages(Math.ceil(response.courses.length / itemsPerPage));
          }
        } else {
          console.error("Invalid data format returned:", response);
          toast.error("Error: Invalid data returned from server");
          setCourses([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error(`Failed to load courses: ${error.message}`);
        setCourses([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage, search, category, sort, priceRange.min, priceRange.max, forceRefreshCounter.current]); // Added forceRefreshCounter.current to dependencies

  useEffect(() => {
    const handleCourseUpdate = (e) => {
      console.log("Course updated event received", e.detail || {});
      
      if (e.detail?.action === 'delete') {
        // For deletions, immediately update the courses list to remove the deleted item
        // This makes the UI more responsive without waiting for a refresh
        setCourses(prevCourses => 
          prevCourses.filter(course => 
            course.id !== e.detail.id && 
            String(course.id) !== String(e.detail.id)
          )
        );
      }
      
      // For all updates, increment the counter to trigger a full refresh on next render cycle
      forceRefreshCounter.current += 1;
    };

    const handleSyncComplete = (e) => {
      console.log("Sync operations complete", e.detail);
      // Force refresh data after sync completes
      forceRefreshCounter.current += 1;
      
      // Display notification about sync status
      if (e.detail?.success) {
        toast.success(`Successfully synchronized ${e.detail.results.length} offline changes`);
      } else {
        toast.warning(`Synchronized with some errors. Some changes may need to be re-applied.`);
      }
      
      // Force a re-render to update the UI with the latest data
      setCurrentPage(currentPage);
    };

    window.addEventListener('courseUpdated', handleCourseUpdate);
    window.addEventListener('syncOperationsComplete', handleSyncComplete);

    return () => {
      window.removeEventListener('courseUpdated', handleCourseUpdate);
      window.removeEventListener('syncOperationsComplete', handleSyncComplete);
    };
  }, [currentPage]);

  useEffect(() => {
    const unsubscribe = offlineService.addListener(status => {
      setIsOfflineMode(!status.isOnline || !status.isServerAvailable);
    });
    
    return () => unsubscribe();
  }, []);

  const handleForceRefresh = () => {
    forceRefreshCounter.current += 1;
    // This will cause a re-render, which will then trigger the useEffect that fetches courses
    setCurrentPage(currentPage); // Force a re-render without changing the page
    toast.info("Manually refreshing courses...");
  };

  const handleTryReconnect = useCallback(async () => {
    try {
      setIsReconnecting(true);
      console.log("Manually triggering reconnect from Home page");
      
      // Dispatch global event to ensure all components know we're trying to reconnect
      window.dispatchEvent(new Event('reconnectServer'));
      
      // Call the manual reconnect directly
      const success = await offlineService.manualReconnect();
      
      if (success) {
        toast.success("Successfully reconnected to server!");
        forceRefreshCounter.current += 1;
        // Force a re-render without changing the page
        setCurrentPage(currentPage);
      } else {
        toast.error("Could not connect to server. Please try again later.");
      }
    } catch (error) {
      console.error("Error during reconnection attempt:", error);
      toast.error("Connection error. Please check your network.");
    } finally {
      setIsReconnecting(false);
    }
  }, [currentPage]);

  const handleSearch = useCallback((value) => {
    console.log(`Search term changed to: "${value}"`);
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((value) => {
    setCategory(value);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((value) => {
    setSort(value);
    setCurrentPage(1);
  }, []);

  const handlePriceRangeChange = useCallback((min, max) => {
    setPriceRange(prevState => {
      // Only update if values have changed to avoid infinite loops
      if (prevState.min !== Number(min) || prevState.max !== Number(max)) {
        return { min: Number(min), max: Number(max) };
      }
      return prevState;
    });
    setCurrentPage(1); // Reset to first page when changing filters
  }, []);

  const filteredCourses = courses;

  const currentCourses = courses;

  const MemoizedSidebar = useMemo(() => (
    <Sidebar 
      onSearch={handleSearch} 
      onFilter={handleFilter} 
      onSort={handleSort}
      onPriceRangeChange={handlePriceRangeChange}
      activeCategory={category} 
    />
  ), [handleSearch, handleFilter, handleSort, handlePriceRangeChange, category]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      <span className="ml-4 text-xl font-semibold text-gray-700">Loading courses...</span>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {MemoizedSidebar}
      
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
                disabled={isOfflineMode}
                className={`px-4 py-2 rounded-lg flex items-center shadow-md ${
                  isSimulationRunning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } ${isOfflineMode ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    {isOfflineMode ? "Simulation Unavailable" : "Start Simulation"}
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
          
          {isOfflineMode && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
              <div className="flex justify-between items-center">
                <p className="text-yellow-800">
                  <strong>Offline Mode:</strong> You're currently working offline. 
                  Your changes will be saved locally and synchronized when you reconnect.
                  <span className="ml-2 text-xs italic">Auto-reconnect attempt every {Math.round(RECONNECTION_INTERVAL/1000)} seconds</span>
                </p>
                <button 
                  onClick={handleTryReconnect}
                  disabled={isReconnecting}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
                >
                  {isReconnecting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : "Try Reconnect"}
                </button>
              </div>
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
                    try {
                      // Try the operation
                      await courseService.deleteCourse(id);
                      
                      // Immediately update the local UI state by filtering out the deleted course
                      setCourses(prevCourses => prevCourses.filter(course => course.id !== id));
                      
                      // Force a data refresh on the next render cycle
                      forceRefreshCounter.current += 1;
                      
                      // Show success message
                      toast.success('Course deleted successfully!');
                    } catch (error) {
                      console.error("Error deleting course:", error);
                      toast.error(`Failed to delete course: ${error.message}`);
                    }
                  }}
                  highlight={getPriceHighlight(course.price, currentCourses)}
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
          
          {/* Always show pagination controls */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow">
            <div className="mb-4 sm:mb-0">
              <span className="text-gray-600">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} courses
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 mr-2">Items per page:</span>
              <div className="flex border border-gray-300 rounded overflow-hidden">
                {[6, 10, 20, 50, 100].map(limit => (
                  <button
                    key={limit}
                    onClick={() => handleItemsPerPageChange(limit)}
                    className={`px-3 py-1 ${itemsPerPage === limit ? 'bg-blue-600 text-white font-semibold' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-colors border-r border-gray-200 last:border-r-0`}
                  >
                    {limit}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex mt-4 sm:mt-0">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-l border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-colors`}
              >
                Prev
              </button>
              
              {Array.from({ length: Math.min(5, Math.max(totalPages, 1)) }, (_, i) => {
                // Logic for page number display
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border-t border-b ${
                      currentPage === page ? 'bg-blue-600 text-white font-semibold' : 'bg-white text-gray-700 hover:bg-gray-100'
                    } transition-colors border-r border-gray-200 last:border-r-0`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.max(totalPages, 1)))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1 rounded-r border ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-colors`}
              >
                Next
              </button>
            </div>
          </div>
          
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
