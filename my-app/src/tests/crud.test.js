import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';
import { generateMockCourses } from '../utils/generateMockCourses';
import Home from '../pages/Home';
import AddCourse from '../pages/AddCourse';

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
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock courseService
jest.mock('../services/courseService', () => ({
  courseService: {
    getCourses: jest.fn(),
    addCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
    isUsingRemoteBackend: jest.fn().mockReturnValue(true),
  },
}));

describe('CRUD Operations', () => {
  let mockCourses;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCourses = generateMockCourses(5);
    
    // Default mock implementations
    courseService.getCourses.mockResolvedValue({
      courses: mockCourses,
      pagination: { 
        page: 1, 
        totalPages: 1, 
        totalItems: mockCourses.length 
      }
    });
    
    courseService.addCourse.mockImplementation(course => 
      Promise.resolve({ ...course, id: Math.max(...mockCourses.map(c => c.id)) + 1 })
    );
    
    courseService.updateCourse.mockImplementation((id, updated) => 
      Promise.resolve({ ...updated, id })
    );
    
    courseService.deleteCourse.mockResolvedValue(true);
    
    // Mock window functions
    window.confirm = jest.fn(() => true);
    window.scrollTo = jest.fn();
  });
  
  // Test 1: Get Courses - Success path
  test('should successfully fetch and display all courses', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Verify loading state
    expect(screen.getByText('Loading all courses...')).toBeInTheDocument();
    
    // Verify courses are loaded (check for more courses now)
    for (const course of mockCourses.slice(0, 5)) { // Check first 5 courses
      await screen.findByText(course.title);
    }
    
    // Verify service was called without pagination limits
    expect(courseService.getCourses).toHaveBeenCalledWith(expect.objectContaining({
      // No page or limit should be passed
      search: undefined,
      category: undefined,
      sortBy: undefined
    }));
  });
  
  // Test 2: Get Courses - Error path
  test('should display error when fetching courses fails', async () => {
    courseService.getCourses.mockRejectedValue(new Error('Failed to fetch courses'));
    
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Wait for error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch courses'));
    });
  });
  
  // Test 3: Add Course - Success path
  test('should successfully add a new course', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    
    const newCourse = {
      title: 'New Test Course',
      category: 'Programming',
      lessons: 10,
      price: 49.99
    };
    
    render(
      <MemoryRouter>
        <AddCourse onAdd={jest.fn()} />
      </MemoryRouter>
    );
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Title'), newCourse.title);
    await userEvent.selectOptions(screen.getByLabelText('Category'), newCourse.category);
    await userEvent.type(screen.getByLabelText('Lessons'), newCourse.lessons.toString());
    await userEvent.type(screen.getByLabelText('Price'), newCourse.price.toString());
    
    // Set duration (hours and minutes)
    await userEvent.selectOptions(screen.getByLabelText('Hours'), '2');
    await userEvent.selectOptions(screen.getByLabelText('Minutes'), '30');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /add course/i }));
    
    // Verify the service was called with the right data
    await waitFor(() => {
      expect(courseService.addCourse).toHaveBeenCalledWith(expect.objectContaining(newCourse));
      expect(toast.success).toHaveBeenCalledWith('Course added successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
  
  // Test 4: Add Course - Validation errors
  test('should display validation errors when submitting invalid data', async () => {
    render(
      <MemoryRouter>
        <AddCourse onAdd={jest.fn()} />
      </MemoryRouter>
    );
    
    // Submit without filling
    await userEvent.click(screen.getByRole('button', { name: /add course/i }));
    
    // Check for validation errors
    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
  });
  
  // Test 5: Update Course - Success path
  test('should successfully update an existing course', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    
    const courseToUpdate = mockCourses[0];
    const updatedTitle = 'Updated Course Title';
    
    render(
      <MemoryRouter>
        <AddCourse onAdd={jest.fn()} initialData={courseToUpdate} />
      </MemoryRouter>
    );
    
    // Clear title field and type new value
    await userEvent.clear(screen.getByLabelText('Title'));
    await userEvent.type(screen.getByLabelText('Title'), updatedTitle);
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /update course/i }));
    
    // Verify service call and toast message
    await waitFor(() => {
      expect(courseService.updateCourse).toHaveBeenCalledWith(
        courseToUpdate.id,
        expect.objectContaining({ title: updatedTitle })
      );
      expect(toast.success).toHaveBeenCalledWith('Course updated successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
  
  // Test 6: Update Course - Error path
  test('should handle errors when updating a course fails', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    
    courseService.updateCourse.mockRejectedValue(new Error('Update failed'));
    
    const courseToUpdate = mockCourses[0];
    
    render(
      <MemoryRouter>
        <AddCourse onAdd={jest.fn()} initialData={courseToUpdate} />
      </MemoryRouter>
    );
    
    // Make a change and submit
    await userEvent.clear(screen.getByLabelText('Title'));
    await userEvent.type(screen.getByLabelText('Title'), 'New Title');
    await userEvent.click(screen.getByRole('button', { name: /update course/i }));
    
    // Verify error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Update failed'));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
  
  // Test 7: Delete Course - Success path
  test('should successfully delete a course', async () => {
    const courseToDelete = mockCourses[0];
    
    render(
      <MemoryRouter>
        <Home onEdit={jest.fn()} />
      </MemoryRouter>
    );
    
    // Wait for course cards to render
    await screen.findByText(courseToDelete.title);
    
    // Find the delete button within the card containing the course title
    const courseCard = screen.getByText(courseToDelete.title).closest('[class*="card"]');
    const deleteButton = within(courseCard).getByRole('button', { name: /delete/i });
    
    // Click delete button
    await userEvent.click(deleteButton);
    
    // Verify confirm dialog and service call
    expect(window.confirm).toHaveBeenCalled();
    
    // Verify deletion 
    await waitFor(() => {
      expect(courseService.deleteCourse).toHaveBeenCalledWith(courseToDelete.id);
      expect(toast.success).toHaveBeenCalledWith('Course deleted successfully!');
    });
  });
  
  // Test 8: Delete Course - User cancels deletion
  test('should not delete course when user cancels confirmation', async () => {
    // Mock confirm to return false (cancel)
    window.confirm = jest.fn(() => false);
    
    const courseToDelete = mockCourses[0];
    
    render(
      <MemoryRouter>
        <Home onEdit={jest.fn()} />
      </MemoryRouter>
    );
    
    // Wait for course cards to render
    await screen.findByText(courseToDelete.title);
    
    // Find the delete button within the card
    const courseCard = screen.getByText(courseToDelete.title).closest('[class*="card"]');
    const deleteButton = within(courseCard).getByRole('button', { name: /delete/i });
    
    // Click delete button
    await userEvent.click(deleteButton);
    
    // Verify confirm was called but delete service wasn't
    expect(window.confirm).toHaveBeenCalled();
    expect(courseService.deleteCourse).not.toHaveBeenCalled();
  });
  
  // Test 9: Delete Course - Error path
  test('should handle errors when deleting a course fails', async () => {
    courseService.deleteCourse.mockRejectedValue(new Error('Delete failed'));
    
    const courseToDelete = mockCourses[0];
    
    render(
      <MemoryRouter>
        <Home onEdit={jest.fn()} />
      </MemoryRouter>
    );
    
    // Wait for course cards to render
    await screen.findByText(courseToDelete.title);
    
    // Find the delete button within the card
    const courseCard = screen.getByText(courseToDelete.title).closest('[class*="card"]');
    const deleteButton = within(courseCard).getByRole('button', { name: /delete/i });
    
    // Click delete button
    await userEvent.click(deleteButton);
    
    // Verify error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Delete failed'));
    });
  });
});
