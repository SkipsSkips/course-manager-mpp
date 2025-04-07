import React, { useEffect, useState, useRef } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { courseService } from '../services/courseService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Charts = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Initial fetch only once
    const fetchCourses = async () => {
      if (!isMounted.current) return;
      setLoading(true);
      try {
        const data = await courseService.getCourses();
        if (isMounted.current) {
          setCourses(data);
        }
      } catch (error) {
        console.error('Error fetching courses for charts:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          isInitialLoad.current = false;
        }
      }
    };

    if (isInitialLoad.current) {
      fetchCourses();
    }

    // Only update on explicit courseUpdated events, not automatically
    const handleCourseUpdate = () => {
      // Don't refresh on every event, only when specifically 
      // adding/deleting, not on normal refreshes
      if (!isInitialLoad.current && isMounted.current) {
        fetchCourses();
      }
    };

    window.addEventListener('courseUpdated', handleCourseUpdate);

    return () => {
      isMounted.current = false;
      window.removeEventListener('courseUpdated', handleCourseUpdate);
    };
  }, []); // Empty dependency array = run only on mount

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="ml-3 text-gray-600">Loading charts...</span>
      </div>
    );
  }

  // Chart 1: Number of Courses per Category (Bar Chart)
  const categories = [...new Set(courses.map(course => course.category))];
  const coursesPerCategory = categories.map(category =>
    courses.filter(course => course.category === category).length
  );

  const coursesPerCategoryData = {
    labels: categories,
    datasets: [
      {
        label: 'Number of Courses',
        data: coursesPerCategory,
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // Blue-500
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 8, // Rounded bars
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
      },
    ],
  };

  // Chart 2: Price Distribution (Doughnut Chart)
  const priceRanges = {
    '0-25': 0,
    '25-50': 0,
    '50-75': 0,
    '75-100': 0,
    '100+': 0,
  };

  courses.forEach(course => {
    if (course.price < 25) priceRanges['0-25']++;
    else if (course.price < 50) priceRanges['25-50']++;
    else if (course.price < 75) priceRanges['50-75']++;
    else if (course.price < 100) priceRanges['75-100']++;
    else priceRanges['100+']++;
  });

  const priceDistributionData = {
    labels: Object.keys(priceRanges),
    datasets: [
      {
        label: 'Price Distribution',
        data: Object.values(priceRanges),
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',  // Red-500
          'rgba(59, 130, 246, 0.7)', // Blue-500
          'rgba(245, 158, 11, 0.7)', // Amber-500
          'rgba(16, 185, 129, 0.7)', // Emerald-500
          'rgba(139, 92, 246, 0.7)', // Purple-500
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(239, 68, 68, 0.9)',
          'rgba(59, 130, 246, 0.9)',
          'rgba(245, 158, 11, 0.9)',
          'rgba(16, 185, 129, 0.9)',
          'rgba(139, 92, 246, 0.9)',
        ],
      },
    ],
  };

  // Chart 3: Average Lessons per Category (Bar Chart)
  const averageLessonsPerCategory = categories.map(category => {
    const categoryCourses = courses.filter(course => course.category === category);
    const totalLessons = categoryCourses.reduce((sum, course) => sum + course.lessons, 0);
    return categoryCourses.length ? totalLessons / categoryCourses.length : 0;
  });

  const averageLessonsData = {
    labels: categories,
    datasets: [
      {
        label: 'Average Lessons',
        data: averageLessonsPerCategory,
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // Emerald-500
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: '500',
          },
          color: '#1F2937', // Gray-800
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)', // Gray-800
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
          weight: '600',
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif",
        },
        padding: 12,
        cornerRadius: 8,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: '#4B5563', // Gray-600
        },
      },
      y: {
        grid: {
          color: 'rgba(209, 213, 219, 0.3)', // Gray-300 with opacity
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: '#4B5563', // Gray-600
          beginAtZero: true,
        },
      },
    },
  };

  // Doughnut-specific options (no scales)
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: '500',
          },
          color: '#1F2937',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
          weight: '600',
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif",
        },
        padding: 12,
        cornerRadius: 8,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2 text-blue-500">📊</span> Courses per Category
        </h2>
        <div className="h-80">
          <Bar data={coursesPerCategoryData} options={chartOptions} />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2 text-red-500">💰</span> Price Distribution
        </h2>
        <div className="h-80">
          <Doughnut data={priceDistributionData} options={doughnutOptions} />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2 text-emerald-500">📚</span> Average Lessons per Category
        </h2>
        <div className="h-80">
          <Bar data={averageLessonsData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
