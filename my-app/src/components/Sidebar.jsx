import React, { useState, useEffect, useRef } from 'react';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getCategoryColor } from '../utils/categoryColors';
import { courseService } from '../services/courseService';

const Sidebar = ({ onSearch, onFilter, onSort, onPriceRangeChange, activeCategory = 'All' }) => {
  // Initialize with default categories to ensure they're always displayed
  const defaultCategories = ['All', 'Programming', 'Design', 'Marketing', 
                            'Data Science', 'Photography', 'Health & Fitness', 'Music'];
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [categories, setCategories] = useState(defaultCategories);
  
  // Price range state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });

  const isMounted = useRef(true);
  const categoriesRef = useRef(defaultCategories);
  
  // Fetch categories and update if API returns successfully
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const courses = await courseService.getCourses();
        if (courses && courses.length > 0 && isMounted.current) {
          // Extract unique categories and make sure 'All' is first
          const apiCategories = [...new Set(courses.map(course => course.category))];
          const uniqueCategories = ['All', ...apiCategories.filter(cat => cat !== 'All')];
          
          // Only update if we got valid categories from API
          if (uniqueCategories.length > 1) {
            setCategories(uniqueCategories);
            categoriesRef.current = uniqueCategories;
          }
          
          // Calculate price range
          if (courses.length > 0) {
            const prices = courses.map(course => course.price);
            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));
            setMinPrice(min);
            setMaxPrice(max);
            setPriceRange({ min, max });
            onPriceRangeChange({ min, max });
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Keep using default categories if fetch fails
      }
    };
    
    fetchCategories();
    
    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array = only on mount
  
  // Only listen for specific "category update" events, not all course updates
  useEffect(() => {
    const handleCategoryUpdate = (e) => {
      // Only update categories if a new category was added
      if (e.detail?.action === 'add' && e.detail?.course?.category) {
        const newCategory = e.detail.course.category;
        if (!categoriesRef.current.includes(newCategory)) {
          const updatedCategories = [...categoriesRef.current, newCategory];
          categoriesRef.current = updatedCategories;
          setCategories(updatedCategories);
        }
      }
    };
    
    window.addEventListener('courseUpdated', handleCategoryUpdate);
    
    return () => {
      window.removeEventListener('courseUpdated', handleCategoryUpdate);
    };
  }, []);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onSearch('');
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    onSort(e.target.value);
  };
  
  // Enhanced handlers for slider thumbs
  const handleMinRangeChange = (e) => {
    const newMin = Math.min(Number(e.target.value), priceRange.max - 1);
    setPriceRange(prev => {
      const newRange = { ...prev, min: newMin };
      onPriceRangeChange(newRange);
      return newRange;
    });
  };
  
  const handleMaxRangeChange = (e) => {
    const newMax = Math.max(Number(e.target.value), priceRange.min + 1);
    setPriceRange(prev => {
      const newRange = { ...prev, max: newMax };
      onPriceRangeChange(newRange);
      return newRange;
    });
  };

  // Improved price range slider implementation
  const renderPriceRangeSlider = () => {
    // Calculate which thumb should be on top based on their proximity
    const minThumbPosition = ((priceRange.min - minPrice) / (maxPrice - minPrice));
    const maxThumbPosition = ((priceRange.max - minPrice) / (maxPrice - minPrice));
    const distance = maxThumbPosition - minThumbPosition;
    
    // Make the min thumb have higher z-index when it's closer to the right
    // and max thumb have higher z-index when it's closer to the left
    const minZIndex = distance < 0.3 ? 30 : 20;
    const maxZIndex = distance < 0.3 ? 20 : 30;
    
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Price Range
        </label>
        
        {/* Price display */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">${priceRange.min}</span>
          <span className="text-sm text-gray-600">${priceRange.max}</span>
        </div>
        
        <div className="relative h-8">
          {/* Track base */}
          <div className="absolute h-1 w-full bg-gray-300 rounded-full top-1/2 transform -translate-y-1/2"></div>
          
          {/* Active range track */}
          <div 
            className="absolute h-1 bg-blue-500 rounded-full top-1/2 transform -translate-y-1/2"
            style={{
              left: `${((priceRange.min - minPrice) / (maxPrice - minPrice)) * 100}%`,
              right: `${100 - ((priceRange.max - minPrice) / (maxPrice - minPrice)) * 100}%`
            }}
          ></div>
          
          {/* Min thumb with greater touch area */}
          <div 
            className="absolute w-5 h-5 bg-white rounded-full border-2 border-blue-500 shadow-md top-1/2 transform -translate-y-1/2 -translate-x-1/2"
            style={{
              left: `${((priceRange.min - minPrice) / (maxPrice - minPrice)) * 100}%`,
              zIndex: minZIndex - 1, // -1 from the input's z-index
            }}
          ></div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={1}
            value={priceRange.min}
            onChange={handleMinRangeChange}
            className="absolute w-full h-8 appearance-none bg-transparent cursor-pointer top-0"
            style={{
              pointerEvents: "auto",
              zIndex: minZIndex,
              opacity: 0
            }}
          />
          
          {/* Max thumb with greater touch area */}
          <div 
            className="absolute w-5 h-5 bg-white rounded-full border-2 border-blue-500 shadow-md top-1/2 transform -translate-y-1/2 -translate-x-1/2"
            style={{
              left: `${((priceRange.max - minPrice) / (maxPrice - minPrice)) * 100}%`,
              zIndex: maxZIndex - 1, // -1 from the input's z-index
            }}
          ></div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={1}
            value={priceRange.max}
            onChange={handleMaxRangeChange}
            className="absolute w-full h-8 appearance-none bg-transparent cursor-pointer top-0"
            style={{
              pointerEvents: "auto",
              zIndex: maxZIndex,
              opacity: 0
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        className="md:hidden fixed top-20 left-4 z-30 p-2 bg-blue-600 text-white rounded-lg shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close Menu' : 'Open Menu'}
      </button>
      
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div
        className={`w-72 bg-gray-100 fixed top-0 left-0 bottom-0 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 z-10 shadow-xl overflow-y-auto`}
        style={{ paddingTop: "4rem" }}
      >
        <div className="p-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Courses
          </label>
          <div className="relative mb-6 group">
            <input
              id="search"
              type="text"
              placeholder="What do you want to learn?"
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 group-hover:shadow-md"
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
          
          {/* Improved price range slider */}
          {renderPriceRangeSlider()}

          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            id="sort"
            value={sortOption}
            onChange={handleSortChange}
            className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select sorting option</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="lessons-asc">Lessons: Low to High</option>
            <option value="lessons-desc">Lessons: High to Low</option>
            <option value="rating-asc">Rating: Low to High</option>
            <option value="rating-desc">Rating: High to Low</option>
          </select>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Categories
          </h3>
          <ul className="space-y-2">
            {categories.map(cat => (
              <li key={cat}>
                <button
                  onClick={() => {
                    onFilter(cat);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center hover:shadow-md ${
                    activeCategory === cat 
                      ? 'bg-blue-500 text-white font-medium' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: activeCategory === cat ? getCategoryColor(cat) : '',
                  }}
                >
                  <span className="mr-2">{cat !== 'All' ? getCategoryIcon(cat) : '🔍'}</span>
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;