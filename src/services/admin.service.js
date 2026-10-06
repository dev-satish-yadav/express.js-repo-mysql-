const Admin = require('../models/admin.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sortFilterPagination } = require('../utils/pagination');

class AdminService {
  async create(data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const admin = await Admin.create(data);
    return admin;
  }

  async login(email, password) {
    const admin = await Admin.unscoped().findOne({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      throw new Error('Invalid email or password');
    }
    const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    
    const adminData = admin.toJSON();
    delete adminData.password;
    
    return { admin: adminData, token };
  }

  async findAll(query = {}) {
    const { page, limit, sort, sort_type, ...filters } = query;
    // We should parse sort and limit for Sequelize
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const offset = (parsedPage - 1) * parsedLimit;
    const order = [];
    if (sort) {
      order.push([sort, sort_type === 'desc' ? 'DESC' : 'ASC']);
    }

    const { count, rows } = await Admin.findAndCountAll({
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
    return Admin.findByPk(id);
  }

  async update(id, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await Admin.update(data, { where: { id } });
    return Admin.findByPk(id);
  }

  async remove(id) {
    return Admin.destroy({ where: { id } });
  }
}

module.exports = new AdminService();
