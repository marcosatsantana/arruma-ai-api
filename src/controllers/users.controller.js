const { ZodError } = require('zod');
const usersRepository = require('../repository/users.repository');
const UsersRepository = require('../repository/users.repository');
const AppError = require('../utils/AppError');
const CategoryRepository = require('../repository/category.repository');
const { createUserSchema, updateUserSchema, updateCategoriasSchema } = require('../validators/userSchemas');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');

class UsersController {
  async findById(req, res) {
    const { id } = req.user;
    try {
      const user = await usersRepository.findById(id)
      if (!user) {
        throw new AppError(404, 'Usuario não encontrado')
      }
      const { senha: _, ...userWithoutPassword } = user;
      userWithoutPassword.categorias = await usersRepository.findCategorias(id);
      return res.status(200).json({ success: true, user: userWithoutPassword })
    } catch (error) {
      return res.status(400).json({ success: false, message: error.errors || error.message });
    }
  }
  async index(req, res) {
    try {
      const { page = 1, limit = 10, tipo, cargo, categoriaid } = req.query;
      const pageInt = parseInt(page, 10);
      const limitInt = parseInt(limit, 10);
      const offset = (pageInt - 1) * limitInt;
      const filters = { tipo, cargo, categoriaid };

      // Busca paginada e total já do banco
      const { data, total } = await UsersRepository.findAll({ offset, limit: limitInt, filters });
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
        tipo: "cidadao",
        cargo: "usuario"
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

  async createAdmin(req, res) {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const existingUser = await UsersRepository.findByEmailOrCpf(validatedData.email, validatedData.cpf);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email ou CPF já cadastrado.' });
      }
      const tipo = validatedData.tipo || "admin";
      const categorias = [...new Set(validatedData.categorias || [])];
      if (categorias.length) {
        if (tipo !== 'prestador') {
          return res.status(400).json({ success: false, message: 'Somente prestadores podem ter categorias de atuação.' });
        }
        const found = await CategoryRepository.findByIds(categorias);
        if (found.length !== categorias.length) {
          return res.status(400).json({ success: false, message: 'Uma ou mais categorias não existem.' });
        }
      }
      const saltRounds = 6;
      const hashedPassword = await bcrypt.hash(validatedData.senha, saltRounds);
      const userData = {
        nome: validatedData.nome,
        email: validatedData.email,
        senha: hashedPassword,
        telefone: validatedData.telefone,
        cpf: validatedData.cpf,
        tipo,
        cargo: validatedData.cargo || "admin"
      };
      const created = await UsersRepository.create(userData);
      if (categorias.length) {
        created[0].categorias = await UsersRepository.setCategorias(created[0].usuarioid, categorias);
      }
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

  async forgotPassword(req, res) {
    const { email } = req.body;
    try {
      if (!email) {
        return res.status(400).json({ success: false, message: 'O email é obrigatório.' });
      }

      const user = await UsersRepository.findByEmail(email);
      if (!user) {
        // Retornamos 200 mesmo se não achar para evitar enumerar e-mails, por segurança.
        return res.status(200).json({ success: true, message: 'Se o email existir, um código será enviado.' });
      }

      // Gera um código numérico de 6 dígitos
      const resetToken = crypto.randomInt(100000, 999999).toString();
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // 1 hora de validade

      await UsersRepository.savePasswordResetToken(user.usuarioid, resetToken, expires);

      const emailText = `Seu código para redefinição de senha é: ${resetToken}\nEste código expira em 1 hora.`;
      const emailHtml = `<p>Seu código para redefinição de senha é: <strong>${resetToken}</strong></p><p>Este código expira em 1 hora.</p>`;

      await sendEmail(user.email, 'Redefinição de Senha', emailText, emailHtml);

      return res.status(200).json({ success: true, message: 'Se o email existir, um código será enviado.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Ocorreu um erro ao solicitar a redefinição de senha.' });
    }
  }

  async resetPassword(req, res) {
    const { token, nova_senha } = req.body;
    try {
      if (!token || !nova_senha) {
        return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios.' });
      }

      const user = await UsersRepository.findByResetToken(token);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Token inválido ou expirado.' });
      }

      const now = new Date();
      if (now > new Date(user.reset_token_expires)) {
        return res.status(400).json({ success: false, message: 'Token inválido ou expirado.' });
      }

      const saltRounds = 6;
      const hashedPassword = await bcrypt.hash(nova_senha, saltRounds);

      await UsersRepository.updatePassword(user.usuarioid, hashedPassword);

      return res.status(200).json({ success: true, message: 'Senha redefinida com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Ocorreu um erro ao redefinir a senha.' });
    }
  }

  async updateCategorias(req, res) {
    const { id } = req.params;
    try {
      const { categorias } = updateCategoriasSchema.parse(req.body);
      const categoriaids = [...new Set(categorias)];

      const user = await UsersRepository.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }
      if (user.tipo !== 'prestador') {
        return res.status(400).json({ success: false, message: 'Somente prestadores podem ter categorias de atuação.' });
      }

      if (categoriaids.length) {
        const found = await CategoryRepository.findByIds(categoriaids);
        if (found.length !== categoriaids.length) {
          return res.status(400).json({ success: false, message: 'Uma ou mais categorias não existem.' });
        }
      }

      const updated = await UsersRepository.setCategorias(user.usuarioid, categoriaids);
      return res.status(200).json({ success: true, usuarioid: user.usuarioid, categorias: updated });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: error.issues[0].message
        });
      }

      console.error(error);
      return res.status(500).json({ success: false, message: 'Ocorreu um erro ao atualizar as categorias do prestador.' });
    }
  }

  async toggleActive(req, res) {
    const { id } = req.params;
    const { ativo } = req.body;
    try {
      if (ativo === undefined) {
        return res.status(400).json({ success: false, message: 'O status ativo é obrigatório.' });
      }
      const user = await UsersRepository.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }
      
      await UsersRepository.update(id, { ativo });
      
      return res.status(200).json({ success: true, message: 'Status do usuário atualizado com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Ocorreu um erro ao atualizar o status do usuário.' });
    }
  }

}

module.exports = new UsersController(); 