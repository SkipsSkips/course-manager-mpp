import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';

const AddCourse = ({ onAdd, initialData }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    lessons: '',
    price: '',
    hours: '',
    minutes: '',
    image: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        category: initialData.category,
        lessons: initialData.lessons.toString(),
        price: initialData.price.toString(),
        hours: '0',
        minutes: '0',
        image: initialData.image || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const course = {
      title: formData.title,
      category: formData.category,
      lessons: parseInt(formData.lessons),
      price: parseFloat(formData.price),
      image: formData.image || null
    };

    try {
      if (initialData) {
        await courseService.updateCourse(initialData.id, course);
        toast.success('Course updated successfully!');
      } else {
        const newCourse = await courseService.addCourse(course);
        toast.success('Course added successfully!');
        console.log('Added course:', newCourse);
      }
      onAdd();
      
      // Use React Router navigation instead of hard page reload
      navigate('/');
      
      // Force a refresh of course data when returning to the home page
      setTimeout(() => {
        window.dispatchEvent(new Event('courseUpdated'));
      }, 100);
    } catch (error) {
      toast.error(`Failed to save: ${error.message}`);
      console.error('Error saving course:', error);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {initialData ? 'Edit Course' : 'Add New Course'}
        </h1>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          Back
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="lessons" className="block text-sm font-medium text-gray-700 mb-1">
            Lessons
          </label>
          <input
            id="lessons"
            name="lessons"
            type="number"
            value={formData.lessons}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration
          </label>
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
                Hours
              </label>
              <select
                id="hours"
                name="hours"
                value={formData.hours}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Hours</option>
                {[...Array(25)].map((_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="w-1/2">
              <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-1">
                Minutes
              </label>
              <select
                id="minutes"
                name="minutes"
                value={formData.minutes}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Minutes</option>
                {[...Array(60)].map((_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a category</option>
            <option value="Programming">Programming</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Data Science">Data Science</option>
            <option value="Photography">Photography</option>
            <option value="Health & Fitness">Health & Fitness</option>
            <option value="Music">Music</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course Image
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-500"
          />
          {formData.image ? (
            <div className="relative mt-2">
              <img 
                src={formData.image} 
                alt="Course preview" 
                className="w-full h-40 object-cover rounded-lg"
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
          ) : null}
          <p className="mt-1 text-sm text-gray-500">
            {formData.image 
              ? "Click the X to reset and use default image" 
              : "If no image is uploaded, a default image will be used"}
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Update Course' : 'Add Course'}
        </button>
      </form>
    </div>
  );
};

export default AddCourse;
