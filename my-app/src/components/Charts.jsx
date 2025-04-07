import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        // Get all courses to calculate stats
        const response = await courseService.getCourses({ limit: 100 });
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
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setError("Failed to load chart data");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);
  
  if (loading) {
    return <div className="flex justify-center items-center h-60">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
        text: 'Course Categories Distribution'
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
        text: 'Course Price Distribution'
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Bar options={categoryChartOptions} data={chartData.categoryData} />
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Doughnut options={priceChartOptions} data={chartData.priceData} />
      </div>
    </div>
  );
};

export default Charts;
