const { Router } = require('express');
const routes = Router();

const sessionsRoutes = require('./sessions.routes');
const usersRoutes = require('./users.routes');
const problemRoutes = require('./problem.routes');

routes.use('/sessions', sessionsRoutes);
routes.use('/users', usersRoutes);
routes.use('/problem', problemRoutes);


module.exports = routes;