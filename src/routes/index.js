const { Router } = require('express');
const routes = Router();

const sessionsRoutes = require('./sessions.routes');
const usersRoutes = require('./users.routes');
const problemRoutes = require('./problem.routes');
const categoryRoutes = require('./category.routes');
const notificationRoutes = require('./notification.routes');
const ordemServicoRoutes = require('./ordem_servico.routes');

routes.use('/sessions', sessionsRoutes);
routes.use('/users', usersRoutes);
routes.use('/category', categoryRoutes);
routes.use('/problem', problemRoutes);
routes.use('/notification', notificationRoutes);
routes.use('/ordemservico', ordemServicoRoutes);


module.exports = routes;