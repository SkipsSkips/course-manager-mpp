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

      // Initialize models FIRST
      await this.initializeModels();
      console.log('✅ Models initialized successfully');

      // THEN sync the database
      await this.sequelize.sync({ 
        force: false,
        alter: false
      });
      
      console.log('✅ Database synchronized successfully');
      
      // FINALLY seed initial data
      await this.seedInitialData();
      console.log('✅ Initial data seeded successfully');
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      throw error;
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
      bio: {
        type: DataTypes.TEXT,
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
      // Check if data already exists before seeding
      const existingCourses = await this.models.Course.findAll();
      if (existingCourses.length > 0) {
        console.log('📊 Data already exists, skipping seed');
        return;
      }

      console.log('🌱 Seeding initial data...');

      // Seed categories first
      const categories = [
        { name: 'Programming', description: 'Web development and programming courses' },
        { name: 'Design', description: 'UI/UX and graphic design courses' },
        { name: 'Marketing', description: 'Digital marketing and business courses' },
        { name: 'Data Science', description: 'Data analysis and machine learning courses' }
      ];

      const createdCategories = await this.models.Category.bulkCreate(categories, {
        returning: true,
        ignoreDuplicates: true
      });

      // Seed instructors
      const instructors = [
        { name: 'John Doe', email: 'john@example.com', bio: 'Senior Web Developer' },
        { name: 'Emily Johnson', email: 'emily@example.com', bio: 'JavaScript Expert' },
        { name: 'Jane Smith', email: 'jane@example.com', bio: 'UX/UI Designer' },
        { name: 'Sarah Johnson', email: 'sarah@example.com', bio: 'Marketing Specialist' }
      ];

      const createdInstructors = await this.models.Instructor.bulkCreate(instructors, {
        returning: true,
        ignoreDuplicates: true
      });

      // Seed courses
      const courses = [
        {
          title: 'Introduction to Web Development',
          description: 'Learn the basics of web development',
          duration: '4h 30m',
          lessons: 12,
          students: 245,
          rating: 4.8,
          price: 49.99,
          categoryId: createdCategories[0]?.id || 1,
          instructorId: createdInstructors[0]?.id || 1,
          image: null
        },
        {
          title: 'Advanced JavaScript Techniques',
          description: 'Master advanced JavaScript concepts',
          duration: '6h 15m',
          lessons: 15,
          students: 310,
          rating: 4.9,
          price: 69.99,
          categoryId: createdCategories[0]?.id || 1,
          instructorId: createdInstructors[1]?.id || 2,
          image: null
        },
        {
          title: 'UI/UX Design Basics',
          description: 'Learn design fundamentals',
          duration: '3h 15m',
          lessons: 8,
          students: 187,
          rating: 4.6,
          price: 39.99,
          categoryId: createdCategories[1]?.id || 2,
          instructorId: createdInstructors[2]?.id || 3,
          image: null
        },
        {
          title: 'Digital Marketing 101',
          description: 'Master digital marketing strategies',
          duration: '3h 0m',
          lessons: 10,
          students: 320,
          rating: 4.7,
          price: 59.99,
          categoryId: createdCategories[2]?.id || 3,
          instructorId: createdInstructors[3]?.id || 4,
          image: null
        }
      ];

      await this.models.Course.bulkCreate(courses, {
        ignoreDuplicates: true
      });

      console.log('✅ Initial data seeded successfully');
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
