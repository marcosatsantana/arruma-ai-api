const locationRepository = require('../repository/location.repository');
const problemRepository = require('../repository/problem.repository');
const imageRepository = require('../repository/images.repository');
const { createProblemSchema } = require('../validators/problemSchemas');

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
        localizacaoid: localizacaoid[0].localizacaoid
      });

      if (validatedData.imagens.length > 0) {
        validatedData.imagens.map(async (image) => {
          await imageRepository.create(image, problemaid[0].problemaid)
        })
      }


      return res.status(201).json({problemaid: problemaid[0].problemaid});
    } catch (error) {
      return res.status(400).json({ success: false, message: error.errors || error.message });
    }
  }

}

module.exports = new ProblemController(); 