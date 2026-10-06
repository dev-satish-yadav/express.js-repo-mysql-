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
    const sortData = { id: 'id', email: 'email', name: 'name' };
    
    const totalRecord = await Admin.count({ where: filters });
    const pagination = sortFilterPagination(page, limit, totalRecord, sortData, sort, sort_type);
    
    const { rows } = await Admin.findAndCountAll({
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
