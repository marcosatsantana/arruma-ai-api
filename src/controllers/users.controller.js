const UsersRepository = require('../repository/users.repository');
const { createUserSchema, updateUserSchema } = require('../validators/userSchemas');
const bcrypt = require('bcryptjs');

class UsersController {
  async index(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageInt = parseInt(page, 10);
      const limitInt = parseInt(limit, 10);
      const offset = (pageInt - 1) * limitInt;

      // Busca paginada e total já do banco
      const { data, total } = await UsersRepository.findAll({ offset, limit: limitInt });
      const totalPages = Math.ceil(total / limitInt);

      return res.json({
        success: true,
        data,
        pagination: {
          total,
          page: pageInt,
          limit: limitInt,
          totalPages
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    const { id } = req.user;
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const updated = await UsersRepository.update(id, validatedData);
      return res.json(updated);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.errors || error.message });
    }
  }

  async create(req, res) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const existingUser = await UsersRepository.findByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email já cadastrado.' });
      }
      const saltRounds = 6;
      const hashedPassword = await bcrypt.hash(validatedData.senha, saltRounds);
      const userData = {
        nome: validatedData.nome,
        email: validatedData.email,
        senha: hashedPassword,
        telefone: validatedData.telefone,
        cpf: validatedData.cpf,
        tipo: validatedData.tipo,
        cargo: validatedData.cargo
      };
      const created = await UsersRepository.create(userData);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.errors || error.message });
    }
  }

}

module.exports = new UsersController(); 