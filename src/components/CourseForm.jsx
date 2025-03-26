import React, { useState } from 'react';
import { coursesRepo } from '../data/coursesRepo';

const CourseForm = ({ onSubmit, initialData }) => {
  const parseDuration = (duration) => {
    if (!duration) return { hours: '', minutes: '' };
    const match = duration.match(/(\d+)h\s*(\d+)m/);
    return match ? { hours: match[1], minutes: match[2] } : { hours: '', minutes: '' };
  };

  const { hours: initialHours, minutes: initialMinutes } = parseDuration(initialData?.duration);

  // Extract unique categories and set a default for new courses
  const categories = [...new Set(coursesRepo.map(course => course.category))];
  const defaultCategory = initialData?.category || categories[0] || '';

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    lessons: initialData?.lessons || '',
    durationHours: initialHours || '',
    durationMinutes: initialMinutes || '',
    price: initialData?.price || '',
    category: defaultCategory
  });

  const [durationError, setDurationError] = useState('');
  const [lessonsError, setLessonsError] = useState('');
  const [priceError, setPriceError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const { durationHours, durationMinutes, lessons, price, ...rest } = formData;

    // Reset errors
    setDurationError('');
    setLessonsError('');
    setPriceError('');

    let hasError = false;

    // Validate duration
    if (!durationHours || !durationMinutes) {
      setDurationError('Please select both hours and minutes for the duration.');
      hasError = true;
    }

    // Validate lessons
    if (!lessons || parseInt(lessons) < 1) {
      setLessonsError('Lessons must be at least 1.');
      hasError = true;
    }

    // Validate price
    if (price === '' || parseFloat(price) < 0) {
      setPriceError('Price cannot be less than 0.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const duration = `${durationHours}h ${durationMinutes}m`;
    onSubmit({ ...rest, lessons: parseInt(lessons), price: parseFloat(price), duration });
  };

  const hoursOptions = Array.from({ length: 25 }, (_, i) => i);
  const minutesOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Lessons</label>
        <input
          type="number"
          value={formData.lessons}
          onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {lessonsError && (
          <p className="mt-2 text-sm text-red-600">{lessonsError}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
        <div className="flex space-x-4">
          <select
            value={formData.durationHours}
            onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
            className="w-1/2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Hours</option>
            {hoursOptions.map(hour => (
              <option key={hour} value={hour}>{hour}</option>
            ))}
          </select>
          <select
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
            className="w-1/2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Minutes</option>
            {minutesOptions.map(minute => (
              <option key={minute} value={minute}>{minute}</option>
            ))}
          </select>
        </div>
        {(formData.durationHours || formData.durationMinutes) && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {formData.durationHours || 0} hours {formData.durationMinutes || 0} minutes
          </p>
        )}
        {durationError && (
          <p className="mt-2 text-sm text-red-600">{durationError}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {priceError && (
          <p className="mt-2 text-sm text-red-600">{priceError}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a category</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Media Upload</label>
        <input 
          type="file" 
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-500" 
          disabled 
        />
        <p className="mt-1 text-sm text-gray-500">Media upload placeholder</p>
      </div>
      <button 
        type="submit" 
        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {initialData?.id ? 'Update Course' : 'Add Course'}
      </button>
    </form>
  );
};

export default CourseForm;