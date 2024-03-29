const bcrypt = require('bcryptjs')
const {
  HttpException
} = require('../../core/http-exception')
const {
  sequelize
} = require('../../core/db')
const {
  Article
} = require('../models/article')
const {
  Notification
} = require('../models/noti')
const {
  Collections
} = require('../models/collections')
const {
  Follow
} = require('../models/follow')
const {
  DataTypes,
  Model
} = require('sequelize')

class User extends Model {
  static async checkOccupied(email) {
    await User.findOne({
      where: {
        email
      }
    }).then(res => {
      if (res) {
        throw new HttpException('邮箱已被注册', 405)
      }
    })
  }
  static async verifyEmailPassword(account, plainPassword) {
    const user = await User.findOne({
      where: {
        nickname: account
      }
    })
    if (!user) {
      throw new HttpException('用户不存在')
    }
    const correct = bcrypt.compareSync(plainPassword, user.password)
    if (!correct) {
      throw new HttpException('密码不正确')
    }
    return user
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uId: {
    type: DataTypes.STRING(60),
    allowNull: false,
    field: 'u_id'
  },
  nickname: {
    type: DataTypes.STRING,
    // unique: true
  },
  email: DataTypes.STRING,
  password: {
    type: DataTypes.STRING,
    set(val) {
      const salt = bcrypt.genSaltSync(10)
      const psw = bcrypt.hashSync(val, salt)
      this.setDataValue('password', psw)
    }
  },
  key: {
    type: DataTypes.STRING(64)
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  lastLoginTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: 'http://localhost:3001/api/v2/img/1'
  }
}, {
  sequelize,
  modelName: 'User',
  freezeTableName: true,
  timestamps: true,
  created: DataTypes.DATE
})

// User->Article 一对多
User.hasMany(Article, {
  foreignKey: 'uId',
  as: 'Articles',
  sourceKey: 'id'
})

Article.belongsTo(User, {
  as: 'User',
  foreignKey: 'uId',
  targetKey: 'id'
})

// User -> Notification 一对多
User.hasMany(Notification, {
  foreignKey: 'uId',
  as: 'Notifications',
  sourceKey: 'id'
})

Notification.belongsTo(User, {
  as: 'User',
  foreignKey: 'uId',
  targetKey: 'id'
})

// User -> Collections 一对多
User.hasMany(Collections, {
  foreignKey: 'uId',
  as: 'Collections',
  sourceKey: 'id'
})

Collections.belongsTo(User, {
  as: 'User',
  foreignKey: 'uId',
  targetKey: 'id'
})

// User -> Follow 一对多
User.hasMany(Follow, {
  foreignKey: 'uId',
  as: 'Follow',
  sourceKey: 'id'
})

Follow.belongsTo(User, {
  as: 'User',
  foreignKey: 'uId',
  targetKey: 'id'
})
// User.sync()

module.exports = {
  User
}