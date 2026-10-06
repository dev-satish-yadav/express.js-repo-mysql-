const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user.model');

const UserToken = sequelize.define('UserToken', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true
});

User.hasMany(UserToken, { foreignKey: 'userId' });
UserToken.belongsTo(User, { foreignKey: 'userId' });

module.exports = UserToken;
