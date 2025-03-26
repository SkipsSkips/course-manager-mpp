import React from 'react';
import { toast } from 'react-toastify';

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

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-100 ${borderClass}`}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
      <p className="text-sm text-gray-500 mb-1">by {course.instructor}</p>
      <p className="text-sm text-gray-500 mb-1">{course.lessons} Lessons</p>
      <p className="text-sm text-gray-500 mb-1">{course.students} Students</p>
      <p className="text-sm text-gray-500 mb-2 flex items-center">
        <span className="text-yellow-500 mr-1">★</span>
        {course.rating.toFixed(1)} / 5
      </p>
      <p className="text-lg font-semibold text-gray-900 mb-4">
        ${course.price.toFixed(2)}
      </p>
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(course)}
          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors duration-200"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors duration-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
