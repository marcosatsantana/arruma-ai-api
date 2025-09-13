const { ZodError } = require('zod');
const usersRepository = require('../repository/users.repository');
const UsersRepository = require('../repository/users.repository');
const AppError = require('../utils/AppError');
const { createUserSchema, updateUserSchema } = require('../validators/userSchemas');
const bcrypt = require('bcryptjs');

class UsersController {
  async findById(req, res) {
    const { id } = req.user;
    try {
      const user = await usersRepository.findById(id)
      if (!user) {
        throw new AppError(404, 'Usuario não encontrado')
      }
      const { senha: _, ...userWithoutPassword } = user;
      return res.status(200).json({ success: true, user: userWithoutPassword })
    } catch (error) {
      return res.status(400).json({ success: false, message: error.errors || error.message });
    }
  }
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
      if (validatedData.email) {
        const userWithEmail = await UsersRepository.findByEmail(validatedData.email);
        // Se existe outro usuário com esse email e não é o próprio usuário
        if (userWithEmail && userWithEmail.usuarioid !== id) {
          return res.status(400).json({
            success: false,
            message: 'Email já cadastrado por outro usuário.'
          });
        }
      }
      const updated = await UsersRepository.update(id, validatedData);
      return res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: error.issues[0].message
        });
      }

      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Ocorreu um erro inesperado no servidor.'
      });
    }
  }

  async create(req, res) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const existingUser = await UsersRepository.findByEmailOrCpf(validatedData.email, validatedData.cpf);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email ou CPF já cadastrado.' });
      }
      const saltRounds = 6;
      const hashedPassword = await bcrypt.hash(validatedData.senha, saltRounds);
      const userData = {
        nome: validatedData.nome,
        email: validatedData.email,
        senha: hashedPassword,
        telefone: validatedData.telefone,
        cpf: validatedData.cpf,
        tipo: "usuario",
        cargo: "cidadao"
      };
      const created = await UsersRepository.create(userData);
      return res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: error.issues[0].message
        });
      }

      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Ocorreu um erro inesperado no servidor.'
      });
    }
  }

}

module.exports = new UsersController(); 