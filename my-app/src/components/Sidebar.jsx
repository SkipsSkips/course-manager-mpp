import React, { useState, useEffect, useRef } from 'react';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getCategoryColor } from '../utils/categoryColors';
import { courseService } from '../services/courseService';

// Further enhanced search component with ultra-robust event handling
class SearchInputBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      internalValue: props.value || ''
    };
    this.inputRef = React.createRef();
    this.containerRef = React.createRef();
    
    // Bind methods to ensure correct this context
    this.blockSubmitEvents = this.blockSubmitEvents.bind(this);
  }
  
  componentDidMount() {
    // Add global capture event listener to block any submit events from bubbling
    if (this.containerRef.current) {
      this.containerRef.current.addEventListener('submit', this.blockSubmitEvents, { capture: true });
      this.containerRef.current.addEventListener('keydown', this.blockEnterKey, { capture: true });
    }
    
    // Add global listener to handle Enter key in case event bubbles up
    document.addEventListener('keydown', this.blockEnterKey, { capture: true });
  }
  
  componentWillUnmount() {
    // Cleanup event listeners
    if (this.containerRef.current) {
      this.containerRef.current.removeEventListener('submit', this.blockSubmitEvents, { capture: true });
      this.containerRef.current.removeEventListener('keydown', this.blockEnterKey, { capture: true });
    }
    document.removeEventListener('keydown', this.blockEnterKey, { capture: true });
  }

  componentDidUpdate(prevProps) {
    // Only update internal state if prop value changes and it's different from internal state
    if (prevProps.value !== this.props.value && this.props.value !== this.state.internalValue) {
      this.setState({ internalValue: this.props.value });
    }
  }
  
  // Block all submit events at capture phase
  blockSubmitEvents(e) {
    const target = e.target;
    
    // Check if the event originated from our input
    if (this.inputRef.current && (target === this.inputRef.current || this.containerRef.current.contains(target))) {
      console.log('Blocking submit event at capture phase');
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
  }
  
  // Block Enter key specifically
  blockEnterKey = (e) => {
    const target = e.target;
    
    // Only block if it's from our input
    if (this.inputRef.current === document.activeElement || 
        (this.inputRef.current && target === this.inputRef.current)) {
      if (e.key === 'Enter') {
        console.log('Blocking Enter key in search input');
        e.stopPropagation();
        e.preventDefault();
        this.inputRef.current.blur(); // Remove focus on Enter
        return false;
      }
    }
  }

  handleInputChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newValue = e.target.value;
    this.setState({ internalValue: newValue }, () => {
      // Only call parent callback after state update
      this.props.onChange(newValue);
    });
  };
  
  handleKeyDown = (e) => {
    // Prevent any form submission behaviors
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      this.inputRef.current.blur(); // Remove focus to hide virtual keyboard on mobile
      return false;
    }
  };
  
  handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    this.setState({ internalValue: '' }, () => {
      this.props.onClear();
      // Focus back on input after clearing
      this.inputRef.current.focus();
    });
  };
  
  render() {
    return (
      <div ref={this.containerRef} className="relative mb-6 group" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <input
            ref={this.inputRef}
            id="search-input"
            type="text"
            placeholder="What do you want to learn?"
            value={this.state.internalValue}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 group-hover:shadow-md"
            autoComplete="off" // Disable browser autocomplete
            onSubmit={e => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
          />
          {this.state.internalValue && (
            <button
              type="button"
              onClick={this.handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      </div>
    );
  }
}

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
  const initialPriceRangeSetRef = useRef(false);
  
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
          
          // Calculate price range ONCE
          if (courses.length > 0 && !initialPriceRangeSetRef.current) {
            const prices = courses.map(course => course.price);
            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));
            
            // Update state safely - outside of render
            setMinPrice(min);
            setMaxPrice(max);
            setPriceRange({ min, max });
            initialPriceRangeSetRef.current = true;
            
            // Don't call the prop function during render!
            // Instead use an effect to notify the parent
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
  
  // Separate effect to notify parent of price range changes
  useEffect(() => {
    // Only notify parent when values actually change and are valid
    if (initialPriceRangeSetRef.current && priceRange.min >= 0 && priceRange.max > priceRange.min) {
      // Use a debounce or throttle approach to avoid too many updates
      const handler = setTimeout(() => {
        onPriceRangeChange(priceRange.min, priceRange.max);
      }, 300); // Wait 300ms before calling parent function
      
      return () => clearTimeout(handler);
    }
  }, [priceRange, onPriceRangeChange, initialPriceRangeSetRef]);

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

  // Ensure proper handling of search events
  const handleSearchChange = (value) => {
    if (searchValue !== value) {
      setSearchValue(value);
      
      // Use a delayed version to prevent excessive updates
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
      
      searchDebounceTimer.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    }
  };

  // Add debounce timer ref
  const searchDebounceTimer = useRef(null);

  const handleClearSearch = () => {
    setSearchValue('');
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    onSearch('');
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    onSort(e.target.value);
  };
  
  // Enhanced handlers for slider thumbs
  const handleMinRangeChange = (e) => {
    const newMin = Math.min(Number(e.target.value), priceRange.max - 1);
    setPriceRange(prev => ({
      ...prev,
      min: newMin
    }));
  };
  
  const handleMaxRangeChange = (e) => {
    const newMax = Math.max(Number(e.target.value), priceRange.min + 1);
    setPriceRange(prev => ({
      ...prev,
      max: newMax
    }));
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
          <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Courses
          </label>
          
          <SearchInputBox 
            value={searchValue} 
            onChange={handleSearchChange} 
            onClear={handleClearSearch} 
          />
          
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