import React from 'react';
import { toast } from 'react-toastify';
import { defaultImageBase64 } from '../utils/defaultImage';

const CourseCard = ({ course, onDelete, onEdit, highlight }) => {
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${course.title}"?`)) {
      try {
        await onDelete(course.id);
        toast.success('Course deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete course.');
      }
    }
  };

  let borderClass = '';
  if (highlight === 'most-expensive') {
    borderClass = 'border-l-4 border-red-500';
  } else if (highlight === 'least-expensive') {
    borderClass = 'border-l-4 border-green-500';
  } else if (highlight === 'average-priced') {
    borderClass = 'border-l-4 border-yellow-500';
  }

  // Use base64 encoded default image
  const defaultImage = defaultImageBase64;

  return (
    <div
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-100 overflow-hidden ${borderClass}`}
    >
      {/* Add a category badge */}
      <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
        {course.category}
      </div>
      
      {/* Image styled as a banner - with loading state */}
      <div className="relative w-full">
        <img
          src={course.image || defaultImage}
          alt={course.title}
          className="w-full h-48 object-cover" // Increased height from h-32 to h-48
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImage;
          }}
          loading="lazy" // Add lazy loading for images
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
          <h3 className="text-lg font-bold text-white mb-1">{course.title}</h3>
          <p className="text-sm text-gray-200">by {course.instructor}</p>
        </div>
      </div>
      
      {/* Course details - rearranged to fit with taller image */}
      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-500">{course.lessons} Lessons</p>
          <p className="text-sm text-gray-500">{course.students} Students</p>
        </div>
        <p className="text-sm text-gray-500 mb-3 flex items-center">
          <span className="text-yellow-500 mr-1">★</span>
          {course.rating.toFixed(1)} / 5
        </p>
        <div className="flex justify-between items-center mb-3">
          <p className="text-lg font-semibold text-gray-900">
            ${course.price.toFixed(2)}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(course)}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors duration-200"
              title="Edit this course" // Add tooltip
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors duration-200"
              title="Delete this course" // Add tooltip
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
