const User = require('../models/user.model');
const UserToken = require('../models/user-token.model');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sortFilterPagination } = require('../utils/pagination');
const userCacheService = require('../cache/user-cache.service');

class UserService {
  async create(data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const user = await User.create(data);
    return user;
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid email or password');
    }
    
    if (!user.isActive) {
      throw new Error('Account disabled');
    }

    const token = crypto.randomBytes(30).toString('hex');
    await UserToken.create({ userId: user.id, token });
    
    const userToCache = {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
    };
    await userCacheService.addUserToCache(userToCache, token);
    
    const userData = user.toJSON();
    delete userData.password;

    return { user: userData, token };
  }

  async findAll(query = {}) {
    const { page, limit, sort, sort_type, ...filters } = query;
    const sortData = { id: 'id', email: 'email', name: 'name' };
    
    const totalRecord = await User.count({ where: filters });
    const pagination = sortFilterPagination(page, limit, totalRecord, sortData, sort, sort_type);
    
    const { rows } = await User.findAndCountAll({
      where: filters,
      order: pagination.sort,
      offset: pagination.start_from,
      limit: pagination.per_page
    });
      
    return {
      data: rows,
      total_count: totalRecord,
      prev_enable: pagination.prev_enable,
      next_enable: pagination.next_enable,
      total_pages: pagination.total_pages,
      per_page: pagination.per_page,
      page: pagination.page
    };
  }

  async findOne(id) {
    return User.findByPk(id);
  }

  async update(id, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await User.update(data, { where: { id } });
    return User.findByPk(id);
  }
}

module.exports = new UserService();
