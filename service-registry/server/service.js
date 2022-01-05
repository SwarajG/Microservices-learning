const express = require('express');
const ServiceRegistry = require('./lib/ServiceRegistry');

const service = express();

module.exports = (config) => {
  const log = config.log();
  // Add a request logging middleware in development mode
  if (service.get('env') === 'development') {
    service.use((req, res, next) => {
      log.debug(`${req.method}: ${req.url}`);
      return next();
    });
  }

  const registry = new ServiceRegistry(log);

  service.put('/register/:servicename/:serviceersion/:serviceport', (req, res) => {
    const { servicename, serviceersion, serviceport } = req.params;
    const serviceip = req.connection.remoteAddress.includes('::') ? `[${req.connection.remoteAddress}]` : req.connection.remoteAddress;
    const key = registry.register(servicename, serviceersion, serviceip, serviceport);
    return res.json({ result: key });
  });

  service.delete('/register/:servicename/:serviceersion/:serviceport', (req, res, next) => {
    const { servicename, serviceersion, serviceport } = req.params;
    const serviceip = req.connection.remoteAddress.includes('::') ? `[${req.connection.remoteAddress}]` : req.connection.remoteAddress;
    const key = registry.unregister(servicename, serviceersion, serviceip, serviceport);
    return res.json({ result: key });
  });

  service.get('/find/:servicename/:serviceersion', (req, res, next) => {
    const { servicename, serviceersion } = req.params;
    const svc = registry.get(servicename, serviceersion);
    if (!svc) {
      return res.status(404).json({ result: 'Service not found' });
    }
    return res.json(svc);
  });

  // eslint-disable-next-line no-unused-vars
  service.use((error, req, res, next) => {
    res.status(error.status || 500);
    // Log out the error to the console
    log.error(error);
    return res.json({
      error: {
        message: error.message,
      },
    });
  });
  return service;
};
