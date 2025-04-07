import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';
import App from './App';
import Home from './pages/Home';
import AddCourse from './pages/AddCourse';
import Sidebar from './components/Sidebar';
import CourseCard from './components/CourseCard';
import Charts from './components/Charts';
import { courseService } from './services/courseService';
import { generateMockCourses } from './utils/generateMockCourses';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container">Mock ToastContainer</div>,
}));

// Mock react-chartjs-2 components
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart">Mock Bar Chart</div>,
  Doughnut: () => <div data-testid="mock-doughnut-chart">Mock Doughnut Chart</div>,
}));

// Mock courseService
jest.mock('./services/courseService', () => ({
  courseService: {
    getCourses: jest.fn(),
    addCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
  },
}));

describe('Course Manager App', () => {
  let mockCourses;

  beforeAll(() => {
    // Suppress React Router future flag warnings
    jest.spyOn(console, 'warn').mockImplementation((message) => {
      if (message.includes('React Router Future Flag Warning')) {
        return;
      }
      console.warn(message);
    });
  });

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Generate mock courses using react-fakers
    mockCourses = generateMockCourses(2);

    // Ensure we have at least 2 courses for tests
    if (mockCourses.length < 2) {
      mockCourses = [
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
          title: 'SEO Strategies for Beginners',
          instructor: 'Mike Brown',
          category: 'Marketing',
          lessons: 8,
          students: 180,
          price: 39.99,
          rating: 4.5,
        },
      ];
    }

    courseService.getCourses.mockResolvedValue(mockCourses);
    courseService.addCourse.mockImplementation(course => Promise.resolve({ ...course, id: 3 }));
    courseService.updateCourse.mockImplementation((id, updatedCourse) => {
      const originalCourse = mockCourses.find(course => course.id === id);
      return Promise.resolve({ ...originalCourse, ...updatedCourse, id });
    });
    courseService.deleteCourse.mockResolvedValue();
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
  });

  // Test 1: App renders without crashing
  test('renders App component without crashing', () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

    render(<App />);
    expect(screen.getByText('Course Manager')).toBeInTheDocument();
    expect(screen.getByText('Add Course')).toBeInTheDocument();
  });

  // Test 2: Home component renders courses
  test('Home component renders courses and handles loading state', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Home onEdit={jest.fn()} />
      </MemoryRouter>
    );

    // Check loading state
    expect(screen.getByText('Loading courses...')).toBeInTheDocument();

    // Use findByText to wait for courses to load
    await screen.findByText(mockCourses[0].title);
    await screen.findByText(mockCourses[1].title);

    // Verify that loading message is gone
    expect(screen.queryByText('Loading courses...')).not.toBeInTheDocument();

    // Scope the query to the first course card
    const firstCourseCard = screen.getByText(mockCourses[0].title).closest('div');
    const firstCourseScope = within(firstCourseCard);

    // Verify course details for the first course
    expect(firstCourseScope.getByText(`by ${mockCourses[0].instructor}`)).toBeInTheDocument();
    expect(firstCourseScope.getByText(`${mockCourses[0].lessons} Lessons`)).toBeInTheDocument();
    expect(firstCourseScope.getByText(`${mockCourses[0].students} Students`)).toBeInTheDocument();

    // Use a custom matcher for the rating within the scoped card
    expect(
      firstCourseScope.getByText((content, element) => {
        const hasStar = element?.textContent?.includes('★');
        const hasRating = element?.textContent?.includes(`${mockCourses[0].rating} / 5`);
        return hasStar && hasRating && element?.tagName.toLowerCase() === 'p';
      })
    ).toBeInTheDocument();

    expect(firstCourseScope.getByText(`$${mockCourses[0].price}`)).toBeInTheDocument();
  });

  // Test 3: Sidebar renders categories and handles search and sort
  test('Sidebar renders categories and handles search and sort', async () => {
    const onSearch = jest.fn();
    const onFilter = jest.fn();
    const onSort = jest.fn();

    render(
      <MemoryRouter>
        <Sidebar onSearch={onSearch} onFilter={onFilter} onSort={onSort} />
      </MemoryRouter>
    );

    // Check categories
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();

    // Test search input
    const searchInput = screen.getByPlaceholderText('Search courses...');
    await userEvent.type(searchInput, 'Course');
    expect(onSearch).toHaveBeenCalledWith('Course');

    // Test clear search
    const clearButton = screen.getByText('✕');
    await userEvent.click(clearButton);
    expect(onSearch).toHaveBeenCalledWith('');

    // Test sort dropdown
    const sortSelect = screen.getByLabelText('Sort By');
    await userEvent.selectOptions(sortSelect, 'rating-desc');
    expect(onSort).toHaveBeenCalledWith('rating-desc');

    // Test category filter
    const programmingButton = screen.getByText('Programming');
    await userEvent.click(programmingButton);
    expect(onFilter).toHaveBeenCalledWith('Programming');
  });

  // Test 4: CourseCard renders and handles edit/delete
  test('CourseCard renders course details and handles edit/delete', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn().mockResolvedValue();
    window.confirm = jest.fn(() => true); // Mock confirm dialog

    render(
      <MemoryRouter>
        <CourseCard
          course={mockCourses[0]}
          onEdit={onEdit}
          onDelete={onDelete}
          highlight="most-expensive"
        />
      </MemoryRouter>
    );

    // Verify course details
    expect(screen.getByText(mockCourses[0].title)).toBeInTheDocument();
    expect(screen.getByText(`by ${mockCourses[0].instructor}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockCourses[0].lessons} Lessons`)).toBeInTheDocument();
    expect(screen.getByText(`${mockCourses[0].students} Students`)).toBeInTheDocument();

    // Scope the query to the rating paragraph
    const ratingElement = screen.getByText((content, element) => {
      const hasStar = element?.textContent?.includes('★');
      const hasRating = element?.textContent?.includes(`${mockCourses[0].rating} / 5`);
      return hasStar && hasRating && element?.tagName.toLowerCase() === 'p';
    });

    expect(ratingElement).toBeInTheDocument();

    expect(screen.getByText(`$${mockCourses[0].price}`)).toBeInTheDocument();

    // Verify highlight styling
    const card = screen.getByText(mockCourses[0].title).closest('div');
    expect(card).toHaveClass('border-l-4 border-red-500');

    // Test edit button
    const editButton = screen.getByText('Edit');
    await userEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(mockCourses[0]);

    // Test delete button
    const deleteButton = screen.getByText('Delete');
    await userEvent.click(deleteButton);
    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(mockCourses[0].id);
    expect(toast.success).toHaveBeenCalledWith('Course deleted successfully!');
  });

  // Test 5: AddCourse component handles form submission for adding a new course
  test('AddCourse component handles form submission for adding a new course', async () => {
    const onAdd = jest.fn();
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <AddCourse onAdd={onAdd} />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('Title'), 'New Course');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Design');
    await userEvent.type(screen.getByLabelText('Lessons'), '10');
    await userEvent.type(screen.getByLabelText('Price'), '29.99');

    // Use the proper labels for Hours and Minutes
    await userEvent.selectOptions(screen.getByLabelText('Hours'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Minutes'), '30');

    await userEvent.click(screen.getByText('Add Course'));

    await waitFor(() => {
      expect(courseService.addCourse).toHaveBeenCalledWith({
        title: 'New Course',
        category: 'Design',
        lessons: 10,
        price: 29.99,
      });
      expect(onAdd).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Course added successfully!');
    });
  });

  // Test 6: AddCourse component handles form submission for editing an existing course
  test('AddCourse component handles form submission for editing an existing course', async () => {
    const onAdd = jest.fn();
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    const initialData = mockCourses[0]; // For editing

    render(
      <MemoryRouter>
        <AddCourse onAdd={onAdd} initialData={initialData} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Title')).toHaveValue(mockCourses[0].title);
    expect(screen.getByLabelText('Category')).toHaveValue(mockCourses[0].category);
    expect(screen.getByLabelText('Lessons')).toHaveValue(mockCourses[0].lessons);
    expect(screen.getByLabelText('Price')).toHaveValue(mockCourses[0].price);

    await userEvent.clear(screen.getByLabelText('Title'));
    await userEvent.type(screen.getByLabelText('Title'), 'Updated Course');

    // Use the proper labels for Hours and Minutes
    await userEvent.selectOptions(screen.getByLabelText('Hours'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Minutes'), '30');

    await userEvent.click(screen.getByText('Update Course'));

    await waitFor(() => {
      expect(courseService.updateCourse).toHaveBeenCalledWith(mockCourses[0].id, {
        title: 'Updated Course',
        category: mockCourses[0].category,
        lessons: mockCourses[0].lessons,
        price: mockCourses[0].price,
      });
      expect(onAdd).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Course updated successfully!');
    });
  });

  // Test 7: Home component handles filtering and sorting
  test('Home component handles filtering and sorting', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Home onEdit={jest.fn()} />
      </MemoryRouter>
    );

    // Wait for courses to load using findByText
    await screen.findByText(mockCourses[0].title);

    // Verify that loading message is gone
    expect(screen.queryByText('Loading courses...')).not.toBeInTheDocument();

    // Test search filter
    const sidebar = screen.getByText('Search Courses').closest('div');
    const searchInput = within(sidebar).getByPlaceholderText('Search courses...');
    await userEvent.type(searchInput, mockCourses[1].title.split(' ')[0]); // Search for part of the second course title
    expect(screen.getByText(mockCourses[1].title)).toBeInTheDocument();
    expect(screen.queryByText(mockCourses[0].title)).not.toBeInTheDocument();

    // Test category filter
    const marketingButton = screen.getByText('Marketing');
    await userEvent.click(marketingButton);
    expect(screen.getByText(mockCourses[1].title)).toBeInTheDocument();
    expect(screen.queryByText(mockCourses[0].title)).not.toBeInTheDocument();

    // Clear search to show all courses
    const clearButton = screen.getByText('✕');
    await userEvent.click(clearButton);

    // Clear category filter to show all courses
    const allButton = screen.getByText('All');
    await userEvent.click(allButton);

    // Verify both courses are present before sorting
    await screen.findByText(mockCourses[0].title);
    await screen.findByText(mockCourses[1].title);

    // Test sorting by rating
    const sortSelect = screen.getByLabelText('Sort By');
    await userEvent.selectOptions(sortSelect, 'rating-desc');

    // Wait for the sort to apply
    await waitFor(
      () => {
        const courseTitles = screen.getAllByText(/by /).map(el => el.previousSibling.textContent);
        // Sort mockCourses by rating in descending order to determine expected order
        const sortedCourses = [...mockCourses].sort((a, b) => b.rating - a.rating);
        expect(courseTitles[0]).toBe(sortedCourses[0].title);
        expect(courseTitles[1]).toBe(sortedCourses[1].title);
      },
      { timeout: 3000 }
    );
  });

  // Test 8: Home component handles pagination
  test('Home component handles pagination', async () => {
    // Mock more courses to test pagination
    const moreCourses = generateMockCourses(8);
    courseService.getCourses.mockResolvedValue(moreCourses);

    render(
      <MemoryRouter initialEntries={['/']}>
        <Home onEdit={jest.fn()} />
      </MemoryRouter>
    );

    // Wait for courses to load using findByText
    await screen.findByText(moreCourses[0].title);

    // Verify that loading message is gone
    expect(screen.queryByText('Loading courses...')).not.toBeInTheDocument();

    // 8 courses, 6 per page, should have 2 pages
    expect(screen.getAllByText(/'s Course/).length).toBe(6); // First page
    const page2Button = screen.getByText('2');
    await userEvent.click(page2Button);
    expect(screen.getByText(moreCourses[6].title)).toBeInTheDocument();
    expect(screen.getByText(moreCourses[7].title)).toBeInTheDocument();
    expect(screen.queryByText(moreCourses[0].title)).not.toBeInTheDocument();
  });

  // Test 9: Charts component renders and updates
  test('Charts component renders and updates', async () => {
    const { rerender } = render(<Charts />);

    // Check loading state
    expect(screen.getByText('Loading charts...')).toBeInTheDocument();

    // Wait for charts to load
    await waitFor(() => {
      expect(screen.getByText('Courses per Category')).toBeInTheDocument();
      expect(screen.getByText('Price Distribution')).toBeInTheDocument();
      expect(screen.getByText('Average Lessons per Category')).toBeInTheDocument();
    });

    // Verify mocked chart components
    expect(screen.getAllByTestId('mock-bar-chart').length).toBe(2);
    expect(screen.getByTestId('mock-doughnut-chart')).toBeInTheDocument();

    // Simulate a course update
    const updatedCourses = [...mockCourses, ...generateMockCourses(1)];
    courseService.getCourses.mockResolvedValue(updatedCourses);

    // Wrap event dispatch in act
    await act(async () => {
      window.dispatchEvent(new Event('courseUpdated'));
    });

    // Wait for the update to complete
    await waitFor(() => {
      expect(courseService.getCourses).toHaveBeenCalledTimes(2);
    });

    // Rerender to ensure the component reflects the updated data
    rerender(<Charts />);
  });

  // Test 10: courseService mock functions work as expected
  test('courseService mock functions work as expected', async () => {
    const newCourse = {
      title: 'Test Course',
      category: 'Test',
      lessons: 5,
      price: 19.99,
    };

    // Test getCourses
    const courses = await courseService.getCourses();
    expect(courses).toEqual(mockCourses);

    // Test addCourse
    const addedCourse = await courseService.addCourse(newCourse);
    expect(addedCourse).toEqual({ ...newCourse, id: 3 });

    // Test updateCourse
    const updatedCourse = await courseService.updateCourse(mockCourses[0].id, { title: 'Updated Course' });
    expect(updatedCourse).toEqual({ ...mockCourses[0], title: 'Updated Course', id: mockCourses[0].id });

    // Test deleteCourse
    await courseService.deleteCourse(mockCourses[0].id);
    expect(courseService.deleteCourse).toHaveBeenCalledWith(mockCourses[0].id);
  });
});
