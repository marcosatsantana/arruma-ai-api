const UsersRepository = require('../repository/users.repository');

async function ensureAdmin(req, res, next) {
  try {
    const usuarioid = req.user.id;
    const user = await UsersRepository.findById(usuarioid);
    if (!user || user.tipo !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acesso restrito a administradores.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao verificar permissão.' });
  }
}

module.exports = ensureAdmin;
