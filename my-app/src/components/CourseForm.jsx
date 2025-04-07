import React, { useState, useRef } from 'react';
import { coursesRepo } from '../data/coursesRepo';

const CourseForm = ({ onSubmit, initialData }) => {
  const fileInputRef = useRef(null);
  
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
    category: defaultCategory,
    image: initialData?.image || ''
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = () => {
    setFormData({ ...formData, image: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Course Image</label>
        <div className="space-y-2">
          <input 
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-500"
          />
          {formData.image ? (
            <div className="relative">
              <img 
                src={formData.image} 
                alt="Course preview" 
                className="mt-2 w-full h-40 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleResetImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Default image will be used</p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            {formData.image 
              ? "Click the X to reset and use default image" 
              : "If no image is uploaded, a default image will be used"}
          </p>
        </div>
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