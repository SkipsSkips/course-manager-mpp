import React, { useState } from 'react';
import { coursesRepo } from '../data/coursesRepo';
import { getCategoryIcon } from '../utils/categoryIcons';

const Sidebar = ({ onSearch, onFilter, onSort, activeCategory = 'All' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [sortOption, setSortOption] = useState('');

  const categories = ['All', ...new Set(coursesRepo.map(course => course.category))];

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

  return (
    <>
      <button
        className="md:hidden fixed top-16 left-4 z-30 p-2 bg-blue-600 text-white rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Close' : 'Menu'}
      </button>
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className={`w-64 bg-gray-100 p-6 pt-20 h-screen fixed top-0 left-0 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 z-20`}
      >
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Courses
        </label>
        <div className="relative">
          <input
            id="search"
            type="text"
            placeholder="Search courses..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full p-3 pr-10 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
        <ul className="space-y-2">
          {categories.map(cat => (
            <li key={cat}>
              <button
                onClick={() => {
                  onFilter(cat);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg transition-colors flex items-center ${
                  activeCategory === cat 
                    ? 'bg-blue-500 text-white font-medium' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{cat !== 'All' ? getCategoryIcon(cat) : '🔍'}</span>
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;