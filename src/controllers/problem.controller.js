const locationRepository = require('../repository/location.repository');
const problemRepository = require('../repository/problem.repository');
const imageRepository = require('../repository/images.repository');
const { createProblemSchema } = require('../validators/problemSchemas');
const { format } = require('date-fns');
const AppError = require('../utils/AppError');

class ProblemController {
  async create(req, res) {
    const { id } = req.user;
    try {
      const validatedData = createProblemSchema.parse(req.body);
      const localizacaoid = await locationRepository.create(validatedData.latitude, validatedData.longitude);

      const problemaid = await problemRepository.create({
        descricao: validatedData.descricao,
        usuarioid: id,
        categoriaid: validatedData.categoriaid,
        localizacaoid: localizacaoid
      });

      const imagens = Array.isArray(validatedData.imagens) ? validatedData.imagens : [];
      imagens.map(async (image) => {
        await imageRepository.create(image, problemaid)
      })


      return res.status(201).json({ problemaid: problemaid });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.errors || error.message });
    }
  }
  async index(req, res) {
    const { id } = req.user;
    const { page = 1, limit = 10 } = req.query;
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const offset = (pageInt - 1) * limitInt;
    try {

      const { data, total } = await problemRepository.findAll({ offset, limit: limitInt, id });
      const totalPages = Math.ceil(total / limitInt);
      const formattedProblems = data.map(problem => ({
        problemaid: problem.problemaid,
        descricao: problem.descricao,
        categoria: problem.categoria,
        status: problem.status,
        data: problem.data_criacao ? format(new Date(problem.data_criacao), 'dd/MM/yyyy HH:mm') : null,
      }));
      return res.json({
        success: true,
        data: formattedProblems,
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
  async updateStatus(req, res) {
    const { id, status } = req.params;
    try {
      const existProblem = await problemRepository.findById(id)
      if (!existProblem) {
        throw new AppError('Problema não encontrado', 404)
      }
      await problemRepository.update(id, status)

      res.status(200).send()

    } catch (error) {
      res.status(error.statusCode).json({ message: error.message })
    }
  }
}

module.exports = new ProblemController(); 