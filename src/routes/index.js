const { Router } = require('express');
const routes = Router();

const sessionsRoutes = require('./sessions.routes');
const usersRoutes = require('./users.routes');

routes.use('/sessions', sessionsRoutes);
routes.use('/users', usersRoutes);


module.exports = routes;