const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

// Import models
const Course = require('./Course');
const Category = require('./Category');
const Instructor = require('./Instructor');
const Enrollment = require('./Enrollment');
const User = require('./User');

// Initialize models
const models = {
  Course: Course(sequelize, Sequelize.DataTypes),
  Category: Category(sequelize, Sequelize.DataTypes),
  Instructor: Instructor(sequelize, Sequelize.DataTypes),
  Enrollment: Enrollment(sequelize, Sequelize.DataTypes),
  User: User(sequelize, Sequelize.DataTypes)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Add sequelize instance to models
models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
