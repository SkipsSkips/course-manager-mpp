import React, { useState, useEffect, useRef } from 'react';
import { courseService } from '../services/courseService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Charts = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshCounter = useRef(0);
  const isInitialMount = useRef(true);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      // Add a cache-busting parameter to avoid getting stale data
      const response = await courseService.getCourses({ 
        limit: 1000, 
        fullData: true,
        _timestamp: Date.now() 
      });
      
      const courses = response.courses || [];
      
      if (courses.length > 0) {
        // Prepare data for category distribution chart
        const categoryCount = {};
        courses.forEach(course => {
          categoryCount[course.category] = (categoryCount[course.category] || 0) + 1;
        });
        
        // Prepare data for price distribution chart
        const priceRanges = {
          'Under $20': 0,
          '$20-$50': 0,
          '$50-$100': 0,
          'Over $100': 0
        };
        
        courses.forEach(course => {
          const price = course.price;
          if (price < 20) priceRanges['Under $20']++;
          else if (price >= 20 && price < 50) priceRanges['$20-$50']++;
          else if (price >= 50 && price < 100) priceRanges['$50-$100']++;
          else priceRanges['Over $100']++;
        });
        
        setChartData({
          categoryData: {
            labels: Object.keys(categoryCount),
            datasets: [
              {
                label: 'Number of Courses',
                data: Object.values(categoryCount),
                backgroundColor: [
                  '#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#EF4444',
                  '#8B5CF6', '#3B82F6', '#06B6D4', '#14B8A6', '#84CC16'
                ],
                borderWidth: 1
              }
            ]
          },
          priceData: {
            labels: Object.keys(priceRanges),
            datasets: [
              {
                label: 'Price Distribution',
                data: Object.values(priceRanges),
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
                borderWidth: 1
              }
            ]
          }
        });

        console.log('Chart data updated with', courses.length, 'courses');
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setError("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchChartData();
  }, []); 

  // Listen for course updates and refresh data
  useEffect(() => {
    const handleCourseUpdate = (e) => {
      // Skip the initial mount event
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      
      console.log('Charts detected course update:', e.detail?.action || 'unknown action');
      
      // Add a small delay to allow the backend to process the change
      const timer = setTimeout(() => {
        refreshCounter.current += 1;
        fetchChartData();
      }, 300);
      
      return () => clearTimeout(timer);
    };

    // Listen for course updates
    window.addEventListener('courseUpdated', handleCourseUpdate);
    
    // Also listen for simulation state changes
    window.addEventListener('simulationStateChanged', handleCourseUpdate);
    
    // Listen for server reconnection events
    window.addEventListener('serverReconnected', handleCourseUpdate);
    
    // Listen for sync completion events
    window.addEventListener('syncOperationsComplete', handleCourseUpdate);
    
    return () => {
      window.removeEventListener('courseUpdated', handleCourseUpdate);
      window.removeEventListener('simulationStateChanged', handleCourseUpdate);
      window.removeEventListener('serverReconnected', handleCourseUpdate);
      window.removeEventListener('syncOperationsComplete', handleCourseUpdate);
    };
  }, []);
  
  if (loading && !chartData) {
    return <div className="flex justify-center items-center h-60">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-700">Loading charts...</span>
    </div>;
  }
  
  if (error) {
    return <div className="bg-red-50 border border-red-300 p-4 rounded-lg">
      <p className="text-red-700">{error}</p>
    </div>;
  }

  if (!chartData) {
    return <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
      <p className="text-yellow-700">No data available for charts</p>
    </div>;
  }

  const categoryChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Courses per Category'
      }
    }
  };

  const priceChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Price Distribution'
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-center font-semibold mb-2 text-gray-700">Courses per Category</h3>
        <Bar options={categoryChartOptions} data={chartData.categoryData} />
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-center font-semibold mb-2 text-gray-700">Price Distribution</h3>
        <Doughnut options={priceChartOptions} data={chartData.priceData} />
      </div>
    </div>
  );
};

export default Charts;
