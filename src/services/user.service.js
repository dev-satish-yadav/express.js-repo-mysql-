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
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const order = [];
    if (sort) {
      order.push([sort, sort_type === 'desc' ? 'DESC' : 'ASC']);
    }

    const { count, rows } = await User.findAndCountAll({
      where: filters,
      limit: parsedLimit,
      offset,
      order: order.length ? order : undefined
    });
      
    const total_pages = Math.ceil(count / parsedLimit);

    return {
      data: rows,
      total_count: count,
      prev_enable: parsedPage > 1,
      next_enable: parsedPage < total_pages,
      total_pages: total_pages,
      per_page: parsedLimit,
      page: parsedPage
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
