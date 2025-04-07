import React from 'react';
import { toast } from 'react-toastify';
import { defaultImageBase64 } from '../utils/defaultImage';
import { getCategoryColor, getContrastColor } from '../utils/categoryColors';

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
  
  // Get background color for category
  const categoryBgColor = getCategoryColor(course.category);
  const categoryTextColor = getContrastColor(categoryBgColor);

  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300 border border-gray-100 overflow-hidden ${borderClass} group`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Image container with hover effect */}
        <div className="relative w-full md:w-2/5 overflow-hidden">
          <img 
            src={
              !course.image || course.image === 'IMAGE_PLACEHOLDER' || course.image === 'defaultImageBase64'
                ? defaultImageBase64 
                : course.image
            }
            alt={course.title}
            className="w-full h-56 md:h-full object-cover object-center"
            onError={(e) => {
              e.target.src = defaultImageBase64;
            }}
          />
          {/* Category badge with specific color */}
          <div 
            className="absolute top-2 right-2 z-2 px-3 py-1 rounded-full shadow-sm transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ 
              backgroundColor: categoryBgColor,
              color: categoryTextColor === "text-white" ? "white" : "black"
            }}
          >
            {course.category}
          </div>
          
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        {/* Course details with enhanced animations */}
        <div className="p-6 flex flex-col justify-between w-full md:w-3/5 transition-all duration-300 group-hover:bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">{course.title}</h3>
            <p className="text-sm text-gray-600 mb-4 transition-all duration-300 group-hover:text-blue-600">by {course.instructor}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <p className="text-sm text-gray-500 flex items-center group-hover:translate-x-1 transition-transform duration-300">
                <span className="mr-2 text-blue-500 group-hover:scale-125 transition-transform duration-300">📚</span> {course.lessons} Lessons
              </p>
              <p className="text-sm text-gray-500 flex items-center group-hover:translate-x-1 transition-transform duration-300">
                <span className="mr-2 text-blue-500 group-hover:scale-125 transition-transform duration-300">👥</span> {course.students}
              </p>
            </div>
            
            {/* Rating - removed hover:text-blue-600 from the font-medium span */}
            <p className="text-sm text-gray-500 mb-5 flex items-center">
              <span className="text-yellow-500 mr-2 group-hover:animate-pulse">★</span>
              <span className="font-medium">{course.rating.toFixed(1)}</span> / 5
            </p>
          </div>
          
          <div className="flex justify-between items-center mt-auto">
            {/* Price with smooth transition */}
            <p className="text-xl font-semibold text-gray-900 transform transition-all duration-300 group-hover:scale-110">
              ${course.price.toFixed(2)}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(course)}
                className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-all duration-200 hover:shadow-md group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white"
                title="Edit this course"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-all duration-200 hover:shadow-md group-hover:scale-105 group-hover:bg-red-600 group-hover:text-white"
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
