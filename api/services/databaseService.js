const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

class DatabaseService {
  constructor() {
    this.sequelize = null;
    this.isInitialized = false;
    this.models = {};
  }

  async initialize() {
    try {
      // Use the PostgreSQL connection from config
      this.sequelize = sequelize;

      // Test the connection
      await this.sequelize.authenticate();
      console.log('✅ Database connection established successfully');

      // Initialize models
      await this.initializeModels();

      // Sync database
      await this.sequelize.sync({ force: false });
      console.log('✅ Database synchronized');

      // Seed initial data if tables are empty
      await this.seedInitialData();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async initializeModels() {
    const { DataTypes } = require('sequelize');

    // Define Category model
    this.models.Category = this.sequelize.define('Category', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    });

    // Define Instructor model
    this.models.Instructor = this.sequelize.define('Instructor', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      rating: {
        type: DataTypes.FLOAT,
        defaultValue: 4.5
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    });

    // Define Course model
    this.models.Course = this.sequelize.define('Course', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lessons: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      duration: {
        type: DataTypes.STRING,
        allowNull: false
      },
      students: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      instructorId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    });

    // Define associations
    this.models.Course.belongsTo(this.models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });

    this.models.Course.belongsTo(this.models.Instructor, {
      foreignKey: 'instructorId',
      as: 'instructor'
    });

    this.models.Category.hasMany(this.models.Course, {
      foreignKey: 'categoryId',
      as: 'courses'
    });

    this.models.Instructor.hasMany(this.models.Course, {
      foreignKey: 'instructorId',
      as: 'courses'
    });
  }

  async seedInitialData() {
    try {
      const { coursesData } = require('../models/courseModel');
      const { defaultImageBase64 } = require('../utils/defaultImage');

      // Check if we already have data
      const existingCourses = await this.models.Course.count();
      if (existingCourses > 0) {
        console.log(`📚 Database already contains ${existingCourses} courses`);
        return;
      }

      console.log('🌱 Seeding initial data...');

      // Create categories and instructors maps
      const categoryMap = new Map();
      const instructorMap = new Map();

      // Process all courses from coursesData
      for (const courseData of coursesData.courses) {
        // Create or get category
        if (!categoryMap.has(courseData.category)) {
          const [category] = await this.models.Category.findOrCreate({
            where: { name: courseData.category },
            defaults: {
              name: courseData.category,
              description: `Courses related to ${courseData.category}`,
              isActive: true
            }
          });
          categoryMap.set(courseData.category, category);
        }

        // Create or get instructor
        if (!instructorMap.has(courseData.instructor)) {
          const [instructor] = await this.models.Instructor.findOrCreate({
            where: { name: courseData.instructor },
            defaults: {
              name: courseData.instructor,
              email: `${courseData.instructor.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              rating: 4.5,
              isActive: true
            }
          });
          instructorMap.set(courseData.instructor, instructor);
        }

        // Create course
        await this.models.Course.create({
          title: courseData.title,
          lessons: courseData.lessons,
          duration: courseData.duration,
          students: courseData.students,
          rating: courseData.rating,
          price: courseData.price,
          image: courseData.image || defaultImageBase64,
          categoryId: categoryMap.get(courseData.category).id,
          instructorId: instructorMap.get(courseData.instructor).id,
          isActive: true
        });
      }

      const totalCourses = await this.models.Course.count();
      const totalCategories = await this.models.Category.count();
      const totalInstructors = await this.models.Instructor.count();

      console.log(`✅ Seeded ${totalCourses} courses, ${totalCategories} categories, ${totalInstructors} instructors`);
    } catch (error) {
      console.error('❌ Error seeding data:', error);
      throw error;
    }
  }

  isReady() {
    return this.isInitialized && this.sequelize;
  }

  getModels() {
    return this.models;
  }

  getSequelize() {
    return this.sequelize;
  }

  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.isInitialized = false;
    }
  }
}

module.exports = new DatabaseService();
