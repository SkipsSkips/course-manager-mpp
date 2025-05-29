import { Sequelize, DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';

// Database connection
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './monitoring.db',
  logging: false
});

// User Model
export class User extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: 'admin' | 'user';
  public isActive!: boolean;
  public isMonitored!: boolean;
  public monitoredSince?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isMonitored: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  monitoredSince: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  hooks: {
    beforeCreate: async (user: User) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Activity Log Model
export class ActivityLog extends Model {
  public id!: number;
  public userId!: number;
  public action!: string;
  public entity!: string;
  public entityId?: number;
  public details?: object;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly timestamp!: Date;
}

ActivityLog.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false // course, user, etc.
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ActivityLog',
  timestamps: false
});

// User Activity Summary Model (for monitoring)
export class UserActivitySummary extends Model {
  public id!: number;
  public userId!: number;
  public date!: string; // YYYY-MM-DD format
  public createActions!: number;
  public readActions!: number;
  public updateActions!: number;
  public deleteActions!: number;
  public totalActions!: number;
  public suspiciousScore!: number;
}

UserActivitySummary.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  createActions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  readActions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  updateActions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  deleteActions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalActions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  suspiciousScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'UserActivitySummary',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'date']
    }
  ]
});

// Define associations
User.hasMany(ActivityLog, { foreignKey: 'userId' });
ActivityLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(UserActivitySummary, { foreignKey: 'userId' });
UserActivitySummary.belongsTo(User, { foreignKey: 'userId' });

export async function initializeDatabase() {
  await sequelize.sync({ force: false });
  
  // Create default admin user if not exists
  const adminExists = await User.findOne({ where: { role: 'admin' } });
  if (!adminExists) {
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Default admin user created: admin/admin123');
  }
}