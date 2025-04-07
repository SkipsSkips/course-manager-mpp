const { coursesData } = require('../models/courseModel');

/**
 * Service for generating chart data
 */
const chartService = {
  /**
   * Get category distribution data for charts
   * @returns {Object} Chart data for category distribution
   */
  getCategoryDistribution: () => {
    const categoryCount = {};
    
    // Count courses by category
    coursesData.courses.forEach(course => {
      if (!categoryCount[course.category]) {
        categoryCount[course.category] = 0;
      }
      categoryCount[course.category]++;
    });
    
    return {
      labels: Object.keys(categoryCount),
      data: Object.values(categoryCount)
    };
  },
  
  /**
   * Get price distribution data for charts
   * @returns {Object} Chart data for price ranges
   */
  getPriceDistribution: () => {
    const priceRanges = {
      '0-25': 0,
      '25-50': 0,
      '50-75': 0,
      '75-100': 0,
      '100+': 0
    };
    
    // Categorize courses by price
    coursesData.courses.forEach(course => {
      if (course.price < 25) priceRanges['0-25']++;
      else if (course.price < 50) priceRanges['25-50']++;
      else if (course.price < 75) priceRanges['50-75']++;
      else if (course.price < 100) priceRanges['75-100']++;
      else priceRanges['100+']++;
    });
    
    return {
      labels: Object.keys(priceRanges),
      data: Object.values(priceRanges)
    };
  },
  
  /**
   * Get average lessons per category
   * @returns {Object} Chart data for lessons per category
   */
  getAverageLessonsPerCategory: () => {
    const categories = {};
    const lessonCounts = {};
    
    // Sum up lessons per category
    coursesData.courses.forEach(course => {
      if (!categories[course.category]) {
        categories[course.category] = 0;
        lessonCounts[course.category] = 0;
      }
      lessonCounts[course.category] += course.lessons;
      categories[course.category]++;
    });
    
    // Calculate averages
    const labels = Object.keys(categories);
    const data = labels.map(category => 
      Math.round(lessonCounts[category] / categories[category])
    );
    
    return { labels, data };
  },
  
  /**
   * Get all chart data in a single call
   * @returns {Object} All chart data
   */
  getAllChartData: () => {
    return {
      categoryDistribution: chartService.getCategoryDistribution(),
      priceDistribution: chartService.getPriceDistribution(),
      averageLessonsPerCategory: chartService.getAverageLessonsPerCategory()
    };
  }
};

module.exports = { chartService };
