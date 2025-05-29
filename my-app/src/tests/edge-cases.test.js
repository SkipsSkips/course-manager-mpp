import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';
import Home from '../pages/Home';
import AddCourse from '../pages/AddCourse';
import Charts from '../components/Charts';

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

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart">Mock Bar Chart</div>,
  Doughnut: () => <div data-testid="mock-doughnut-chart">Mock Doughnut Chart</div>,
}));

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Test 1: Network error handling
  test('should display network error message when API is unavailable', async () => {
    // Simulate network error
    courseService.getCourses.mockRejectedValue(new Error('Network Error'));
    
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Verify loading state initially
    expect(screen.getByText('Loading courses...')).toBeInTheDocument();
    
    // Verify error message appears
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Network Error'));
    });
    
    // Verify empty state
    await screen.findByText(/No courses found/i);
  });
  
  // Test 2: Form validation - Empty fields
  test('should show validation errors for empty required fields', async () => {
    render(
      <MemoryRouter>
        <AddCourse onAdd={jest.fn()} />
      </MemoryRouter>
    );
    
    // Submit the form without filling any fields
    const submitButton = screen.getByRole('button', { name: /add course/i });
    await userEvent.click(submitButton);
    
    // Check for validation errors
    const errorMessages = await screen.findAllByText(/required|must be/i);
    expect(errorMessages.length).toBeGreaterThan(0);
    
    // Verify service was not called due to validation errors
    expect(courseService.addCourse).not.toHaveBeenCalled();
  });
  
  // Test 3: Form validation - Invalid numeric inputs
  test('should validate numeric inputs for lessons and price', async () => {
    render(
      <MemoryRouter>
        <AddCourse onAdd={jest.fn()} />
      </MemoryRouter>
    );
    
    // Fill required fields but with invalid numeric values
    await userEvent.type(screen.getByLabelText('Title'), 'Test Course');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Programming');
    
    // Invalid lessons (negative number)
    await userEvent.type(screen.getByLabelText('Lessons'), '-5');
    
    // Invalid price (negative price)
    await userEvent.type(screen.getByLabelText('Price'), '-20');
    
    // Select duration
    await userEvent.selectOptions(screen.getByLabelText('Hours'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Minutes'), '30');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /add course/i }));
    
    // Check for validation errors specifically for numeric fields
    await waitFor(() => {
      expect(screen.getByText(/lessons must be/i)).toBeInTheDocument();
      expect(screen.getByText(/price cannot be/i)).toBeInTheDocument();
    });
    
    // Verify service was not called
    expect(courseService.addCourse).not.toHaveBeenCalled();
  });
  
  // Test 4: Charts component error handling
  test('should handle errors when loading chart data', async () => {
    // Simulate error in chart data loading
    courseService.getCourses.mockRejectedValue(new Error('Failed to load chart data'));
    
    render(<Charts />);
    
    // Verify loading state initially
    expect(screen.getByText('Loading charts...')).toBeInTheDocument();
    
    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/Failed to load chart data/i)).toBeInTheDocument();
    });
  });
  
  // Test 5: Empty state rendering
  test('should render empty state when no courses available', async () => {
    // Return empty courses array
    courseService.getCourses.mockResolvedValue({
      courses: [],
      pagination: { page: 1, totalPages: 0, totalItems: 0 }
    });
    
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    // Verify loading message initially
    expect(screen.getByText('Loading courses...')).toBeInTheDocument();
    
    // Verify empty state message appears
    await waitFor(() => {
      expect(screen.getByText(/No courses found/i)).toBeInTheDocument();
    });
  });
  
  // Test 6: User interaction with pending API
  test('should disable form during submission', async () => {
    // Set up a promise that doesn't resolve immediately to test loading state
    let resolvePromise;
    courseService.addCourse.mockImplementation(() => new Promise(resolve => {
      resolvePromise = resolve;
    }));
    
    render(
      <MemoryRouter>
        <AddCourse onAdd={jest.fn()} />
      </MemoryRouter>
    );
    
    // Fill the form with valid data
    await userEvent.type(screen.getByLabelText('Title'), 'Test Course');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Programming');
    await userEvent.type(screen.getByLabelText('Lessons'), '10');
    await userEvent.type(screen.getByLabelText('Price'), '49.99');
    
    // Set duration (hours and minutes)
    await userEvent.selectOptions(screen.getByLabelText('Hours'), '2');
    await userEvent.selectOptions(screen.getByLabelText('Minutes'), '30');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /add course/i });
    await userEvent.click(submitButton);
    
    // Verify button is disabled or shows loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    
    // Resolve the promise to complete the test
    resolvePromise({ id: 1 }); 
  });
  
  // Test 7: Browser navigation with unsaved changes warning
  test('should warn about unsaved changes when navigating away', async () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => false);
    
    // Mock navigation hook to capture the prevention
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    
    render(
      <MemoryRouter>
        <AddCourse onAdd={jest.fn()} />
      </MemoryRouter>
    );
    
    // Make a change to the form
    await userEvent.type(screen.getByLabelText('Title'), 'Test Course');
    
    // Simulate navigation using the back button
    const backButton = screen.getByText('Back');
    await userEvent.click(backButton);
    
    // Check if confirmation was requested
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('unsaved changes'));
    
    // Navigation should be prevented
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  // Test 8: Cache busting for course updates
  test('should refresh courses after an update', async () => {
    const mockCourses = [{ id: 1, title: 'Original Title', category: 'Programming', lessons: 10, price: 49.99 }];
    
    // Set up two different responses for getCourses
    courseService.getCourses
      .mockResolvedValueOnce({ 
        courses: mockCourses, 
        pagination: { page: 1, totalPages: 1, totalItems: 1 } 
      })
      .mockResolvedValueOnce({
        courses: [{ ...mockCourses[0], title: 'Updated Title' }],
        pagination: { page: 1, totalPages: 1, totalItems: 1 }
      });
    
    courseService.updateCourse.mockResolvedValue({ ...mockCourses[0], title: 'Updated Title' });
    
    const { rerender } = render(
      <MemoryRouter>
        <Home onEdit={jest.fn()} />
      </MemoryRouter>
    );
    
    // Wait for initial course to load
    await screen.findByText('Original Title');
    
    // Simulate a course update event
    await waitFor(() => {
      window.dispatchEvent(new CustomEvent('courseUpdated', {
        detail: {
          action: 'update',
          course: { ...mockCourses[0], title: 'Updated Title' }
        }
      }));
    });
    
    // Check that the courses were refreshed
    await waitFor(() => {
      expect(courseService.getCourses).toHaveBeenCalledTimes(2);
    });
    
    // Rerender to see updated content
    rerender(
      <MemoryRouter>
        <Home onEdit={jest.fn()} />
      </MemoryRouter>
    );
    
    // Verify the updated course appears
    await screen.findByText('Updated Title');
  });
});
