import React, { useEffect, useState, useRef } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Charts = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!isMounted.current) return;
      setLoading(true);
      try {
        const response = await fetch('/api/charts', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        
        const data = await response.json();
        if (isMounted.current) {
          setChartData(data);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        if (isMounted.current) {
          setError('Failed to load chart data. Please try again later.');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchChartData();

    // Listen for course updates to refresh chart data
    const handleCourseUpdate = () => {
      fetchChartData();
    };
    
    window.addEventListener('courseUpdated', handleCourseUpdate);
    
    return () => {
      isMounted.current = false;
      window.removeEventListener('courseUpdated', handleCourseUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="ml-2">Loading charts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Reload
        </button>
      </div>
    );
  }

  if (!chartData) {
    return null;
  }

  // Chart 1: Course Distribution by Category (Doughnut Chart)
  const categoryData = {
    labels: chartData.categoryDistribution.labels,
    datasets: [
      {
        data: chartData.categoryDistribution.data,
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(54, 162, 235, 0.9)',
          'rgba(255, 99, 132, 0.9)',
          'rgba(255, 206, 86, 0.9)',
          'rgba(75, 192, 192, 0.9)',
          'rgba(153, 102, 255, 0.9)',
          'rgba(255, 159, 64, 0.9)',
          'rgba(199, 199, 199, 0.9)',
        ],
      },
    ],
  };

  // Chart 2: Price Distribution (Doughnut Chart)
  const priceDistributionData = {
    labels: chartData.priceDistribution.labels,
    datasets: [
      {
        label: 'Price Distribution',
        data: chartData.priceDistribution.data,
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
  const averageLessonsData = {
    labels: chartData.averageLessonsPerCategory.labels,
    datasets: [
      {
        label: 'Average Lessons',
        data: chartData.averageLessonsPerCategory.data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // Blue-500
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
      },
    ],
  };

  // Common options for bar charts
  const barOptions = {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Course Distribution by Category</h3>
        <div className="h-64">
          <Doughnut data={categoryData} options={doughnutOptions} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Price Distribution</h3>
        <div className="h-64">
          <Doughnut data={priceDistributionData} options={doughnutOptions} />
        </div>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Average Lessons per Category</h3>
        <div className="h-64">
          <Bar data={averageLessonsData} options={barOptions} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
