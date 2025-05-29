module.exports = (sequelize, DataTypes) => {
  const Instructor = sequelize.define('Instructor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expertise: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 5
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'instructors',
    timestamps: true
  });

  Instructor.associate = (models) => {
    // One-to-Many: Instructor has many Courses
    Instructor.hasMany(models.Course, {
      foreignKey: 'instructorId',
      as: 'courses'
    });
  };

  return Instructor;
};
