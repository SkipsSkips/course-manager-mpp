module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 200]
      }
    },
    lessons: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false
    },
    students: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    instructorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'instructors',
        key: 'id'
      }
    }
  }, {
    tableName: 'courses',
    timestamps: true
  });

  Course.associate = (models) => {
    // Many-to-One: Course belongs to Category
    Course.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });

    // Many-to-One: Course belongs to Instructor
    Course.belongsTo(models.Instructor, {
      foreignKey: 'instructorId',
      as: 'instructor'
    });

    // Many-to-Many: Course has many Users through Enrollments
    Course.belongsToMany(models.User, {
      through: models.Enrollment,
      foreignKey: 'courseId',
      otherKey: 'userId',
      as: 'enrolledUsers'
    });
  };

  return Course;
};
