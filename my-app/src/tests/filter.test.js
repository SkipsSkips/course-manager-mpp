import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { generateMockCourses } from '../utils/generateMockCourses';
import Home from '../pages/Home';
import Sidebar from '../components/Sidebar';

// Mock courseService
jest.mock('../services/courseService', () => ({
  courseService: {
    getCourses: jest.fn(),
  },
}));

describe('Filter and Search Operations', () => {
  const mockCategories = ['Programming', 'Design', 'Marketing', 'Data Science', 'Photography'];
  
  // Configure diverse mock courses to test all filtering capabilities
  const configureMockCourses = () => {
    const courses = [
      {
        id: 1,
        title: 'React Fundamentals',
        instructor: 'John Doe',
        category: 'Programming',
        lessons: 12,
        students: 245,
        price: 49.99,
        rating: 4.8,
      },
      {
        id: 2,
        title: 'Advanced JavaScript',
        instructor: 'Jane Smith',
        category: 'Programming',
        lessons: 15,
        students: 310,
        price: 69.99,
        rating: 4.9,
      },
      {
        id: 3,
        title: 'UI/UX Design Basics',
        instructor: 'Alice Johnson',
        category: 'Design',
        lessons: 8,
        students: 187,
        price: 39.99,
        rating: 4.6,
      },
      {
        id: 4,
        title: 'Digital Marketing 101',
        instructor: 'Mike Brown',
        category: 'Marketing',
        lessons: 10,
        students: 320,
        price: 59.99,
        rating: 4.7,
      },
      {
        id: 5,
        title: 'Python for Data Science',
        instructor: 'Sarah Wilson',
        category: 'Data Science',
        lessons: 14,
        students: 280,
        price: 79.99,
        rating: 4.8,
      },
      {
        id: 6,
        title: 'Photography Masterclass',
        instructor: 'David Miller',
        category: 'Photography',
        lessons: 12,
        students: 190,
        price: 89.99,
        rating: 4.7,
      },
      {
        id: 7,
        title: 'Budget Photography Tips',
        instructor: 'Emma Davis',
        category: 'Photography',
        lessons: 8,
        students: 150,
        price: 29.99,
        rating: 4.5,
      },
      {
        id: 8,
        title: 'Advanced React Patterns',
        instructor: 'John Doe',
        category: 'Programming',
        lessons: 10,
        students: 260,
        price: 99.99,
        rating: 4.9,
      }
    ];
    
    return courses;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    const mockCourses = configureMockCourses();
    
    // Default implementation for getCourses that properly filters/sorts/paginates
    courseService.getCourses.mockImplementation((filters = {}) => {
      let filteredCourses = [...mockCourses];
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCourses = filteredCourses.filter(course => 
          course.title.toLowerCase().includes(searchLower) || 
          course.instructor.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply category filter
      if (filters.category && filters.category !== 'All') {
        filteredCourses = filteredCourses.filter(course => 
          course.category === filters.category
        );
      }
      
      // Apply price range filter
      if (filters.priceMin !== undefined) {
        filteredCourses = filteredCourses.filter(course => 
          course.price >= parseFloat(filters.priceMin)
        );
      }
      
      if (filters.priceMax !== undefined) {
        filteredCourses = filteredCourses.filter(course => 
          course.price <= parseFloat(filters.priceMax)
        );
      }
      
      // Apply sorting
      if (filters.sortBy) {
        switch(filters.sortBy) {
          case 'title':
            filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 'price-asc':
            filteredCourses.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            filteredCourses.sort((a, b) => b.price - a.price);
            break;
          case 'rating-desc':
            filteredCourses.sort((a, b) => b.rating - a.rating);
            break;
        }
      }
      
      // Apply pagination only if explicitly requested
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || filteredCourses.length; // Return all if no limit specified
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedCourses = filteredCourses.slice(startIndex, endIndex);
      const totalItems = filteredCourses.length;
      const totalPages = Math.ceil(totalItems / limit);
      
      return Promise.resolve({
        courses: paginatedCourses,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages
        }
      });
    });
    
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
  });
  
  // Test 1: Search functionality
  test('should filter courses by search term', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for initial courses to load
    await screen.findByText('React Fundamentals');
    
    // Find search input in sidebar
    const searchInput = screen.getByPlaceholderText('Search courses...');
    
    // Search for "React"
    await userEvent.type(searchInput, 'React');
    
    // Verify only React courses are shown
    await waitFor(() => {
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
      expect(screen.queryByText('UI/UX Design Basics')).not.toBeInTheDocument();
    });
    
    // Verify service was called with search parameter
    expect(courseService.getCourses).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'React' })
    );
  });
  
  // Test 2: Search by instructor
  test('should filter courses by instructor name', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for initial courses to load
    await screen.findByText('React Fundamentals');
    
    // Find search input in sidebar
    const searchInput = screen.getByPlaceholderText('Search courses...');
    
    // Search for "John Doe" (instructor)
    await userEvent.type(searchInput, 'John Doe');
    
    // Verify only John Doe's courses are shown
    await waitFor(() => {
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
      expect(screen.queryByText('UI/UX Design Basics')).not.toBeInTheDocument();
      expect(screen.queryByText('Digital Marketing 101')).not.toBeInTheDocument();
    });
  });
  
  // Test 3: Category filtering
  test('should filter courses by category', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for initial courses to load
    await screen.findByText('React Fundamentals');
    
    // Click on Design category button
    const designButton = screen.getByText('Design');
    await userEvent.click(designButton);
    
    // Verify only Design courses are shown
    await waitFor(() => {
      expect(screen.getByText('UI/UX Design Basics')).toBeInTheDocument();
      expect(screen.queryByText('React Fundamentals')).not.toBeInTheDocument();
    });
    
    // Verify service was called with category parameter
    expect(courseService.getCourses).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Design' })
    );
  });
  
  // Test 4: Price range filtering
  test('should filter courses by price range', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for initial courses to load
    await screen.findByText('React Fundamentals');
    
    // Find price range slider (this might need to be adjusted based on your component implementation)
    // Let's assume we can set the min/max directly by interacting with price inputs
    const sidebar = screen.getByText('Price Range').closest('div');
    const minPriceInput = within(sidebar).getByLabelText('Min Price');
    const maxPriceInput = within(sidebar).getByLabelText('Max Price');
    
    // Set price range 30-60
    await userEvent.clear(minPriceInput);
    await userEvent.type(minPriceInput, '30');
    await userEvent.clear(maxPriceInput);
    await userEvent.type(maxPriceInput, '60');
    
    // Trigger filter (if there's a button, or wait for debounce)
    const applyFilterButton = within(sidebar).getByText('Apply');
    await userEvent.click(applyFilterButton);
    
    // Wait for filter to be applied
    await waitFor(() => {
      // These courses have prices in the $30-60 range
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument(); // $49.99
      expect(screen.getByText('UI/UX Design Basics')).toBeInTheDocument(); // $39.99
      expect(screen.getByText('Digital Marketing 101')).toBeInTheDocument(); // $59.99
      
      // These are outside the range
      expect(screen.queryByText('Advanced JavaScript')).not.toBeInTheDocument(); // $69.99
      expect(screen.queryByText('Python for Data Science')).not.toBeInTheDocument(); // $79.99
    });
    
    // Verify service was called with price range parameters
    expect(courseService.getCourses).toHaveBeenCalledWith(
      expect.objectContaining({ 
        priceMin: '30',
        priceMax: '60'
      })
    );
  });
  
  // Test 5: Sorting functionality
  test('should sort courses by different criteria', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for initial courses to load
    await screen.findByText('React Fundamentals');
    
    // Find sort dropdown
    const sortDropdown = screen.getByLabelText('Sort By');
    
    // Test sort by price (high to low)
    await userEvent.selectOptions(sortDropdown, 'price-desc');
    
    // Verify courses are sorted by price (high to low)
    await waitFor(() => {
      const courseTitles = screen.getAllByText(/\$/i).map(element => 
        element.textContent.trim()
      );
      
      // Check if prices are in descending order
      const prices = courseTitles.map(text => 
        parseFloat(text.replace('$', ''))
      );
      
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });
    
    // Verify service was called with sort parameter
    expect(courseService.getCourses).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'price-desc' })
    );
    
    // Test sort by rating
    await userEvent.selectOptions(sortDropdown, 'rating-desc');
    
    // Verify service was called with the new sort parameter
    expect(courseService.getCourses).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'rating-desc' })
    );
  });
  
  // Test 6: Pagination
  test('should paginate results and navigate between pages', async () => {
    // Add more mock courses to test pagination
    const mockCourses = configureMockCourses();
    courseService.getCourses.mockImplementation(filters => {
      const page = filters?.page || 1;
      const limit = filters?.limit || 6;
      
      // Calculate start and end indexes
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return Promise.resolve({
        courses: mockCourses.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          totalItems: mockCourses.length,
          totalPages: Math.ceil(mockCourses.length / limit)
        }
      });
    });
    
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for initial courses (page 1) to load
    await screen.findByText('React Fundamentals');
    
    // Verify first page courses are shown
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
    
    // Find and click on page 2 button
    const page2Button = screen.getByText('2');
    await userEvent.click(page2Button);
    
    // Wait for page 2 courses to load
    await waitFor(() => {
      // Verify service was called with page parameter
      expect(courseService.getCourses).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });
  
  // Test 7: Combining filters
  test('should apply multiple filters simultaneously', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for initial courses to load
    await screen.findByText('React Fundamentals');
    
    // Apply category filter
    const programmingButton = screen.getByText('Programming');
    await userEvent.click(programmingButton);
    
    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search courses...');
    await userEvent.type(searchInput, 'Advanced');
    
    // Verify that both filters are applied together
    await waitFor(() => {
      expect(screen.getByText('Advanced JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
      expect(screen.queryByText('React Fundamentals')).not.toBeInTheDocument();
    });
    
    // Verify service was called with both parameters
    expect(courseService.getCourses).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Programming',
        search: 'Advanced'
      })
    );
  });
  
  // Test 8: Clearing filters
  test('should clear filters when reset button is clicked', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for initial courses to load
    await screen.findByText('React Fundamentals');
    
    // Apply search filter first
    const searchInput = screen.getByPlaceholderText('Search courses...');
    await userEvent.type(searchInput, 'React');
    
    // Verify filter applied
    await waitFor(() => {
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.queryByText('Digital Marketing 101')).not.toBeInTheDocument();
    });
    
    // Find and click clear search button
    const clearSearchButton = screen.getByText('✕');
    await userEvent.click(clearSearchButton);
    
    // Verify all courses are shown again
    await waitFor(() => {
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Digital Marketing 101')).toBeInTheDocument();
    });
    
    // Now apply category filter
    const designButton = screen.getByText('Design');
    await userEvent.click(designButton);
    
    // Verify category filter applied
    await waitFor(() => {
      expect(screen.getByText('UI/UX Design Basics')).toBeInTheDocument();
      expect(screen.queryByText('React Fundamentals')).not.toBeInTheDocument();
    });
    
    // Clear category filter by clicking All button
    const allButton = screen.getByText('All');
    await userEvent.click(allButton);
    
    // Verify all courses are shown again
    await waitFor(() => {
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('UI/UX Design Basics')).toBeInTheDocument();
    });
  });
  
  // Test 9: No results state
  test('should display "no courses" message when filters yield no results', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for initial courses to load
    await screen.findByText('React Fundamentals');
    
    // Search for a non-existent course
    const searchInput = screen.getByPlaceholderText('Search courses...');
    await userEvent.type(searchInput, 'NonExistentCourse');
    
    // Verify no courses message is displayed
    await waitFor(() => {
      expect(screen.getByText(/No courses found/i)).toBeInTheDocument();
    });
  });
});
