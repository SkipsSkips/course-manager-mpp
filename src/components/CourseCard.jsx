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
      className={`relative bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300 border border-gray-100 overflow-hidden ${borderClass}`}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image container */}
        <div className="relative w-full md:w-2/5">
          <img
            src={course.image || defaultImage}
            alt={course.title}
            className="w-full h-full object-cover min-h-[200px]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultImage;
            }}
            loading="lazy"
          />
          {/* Category badge */}
          <div className="absolute top-2 right-2 z-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
            {course.category}
          </div>
        </div>
        
        {/* Course details */}
        <div className="p-5 flex flex-col justify-between w-full md:w-3/5">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
            <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <p className="text-sm text-gray-500 flex items-center">
                <span className="mr-1">📚</span> {course.lessons} Lessons
              </p>
              <p className="text-sm text-gray-500 flex items-center">
                <span className="mr-1">👥</span> {course.students} Students
              </p>
            </div>
            
            <p className="text-sm text-gray-500 mb-4 flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              {course.rating.toFixed(1)} / 5
            </p>
          </div>
          
          <div className="flex justify-between items-center mt-auto">
            <p className="text-lg font-semibold text-gray-900">
              ${course.price.toFixed(2)}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(course)}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors duration-200"
                title="Edit this course"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors duration-200"
                title="Delete this course"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
