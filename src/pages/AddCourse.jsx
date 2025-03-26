import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';

const AddCourse = ({ onAdd, initialData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    lessons: '',
    price: '',
    hours: '',
    minutes: '',
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
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const course = {
      title: formData.title,
      category: formData.category,
      lessons: parseInt(formData.lessons),
      price: parseFloat(formData.price),
    };

    try {
      if (initialData) {
        await courseService.updateCourse(initialData.id, course);
        toast.success('Course updated successfully!');
      } else {
        await courseService.addCourse(course);
        toast.success('Course added successfully!');
      }
      onAdd();
      navigate('/');
    } catch (error) {
      toast.error('Error saving course');
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
            Media Upload
          </label>
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
          {initialData ? 'Update Course' : 'Add Course'}
        </button>
      </form>
    </div>
  );
};

export default AddCourse;
