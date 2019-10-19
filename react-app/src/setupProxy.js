const proxy = require('http-proxy-middleware');
const morgan = require('morgan');

module.exports = function(app) {
    // app.use(proxy('/services/service_wizard', { target: 'http://localhost:3001', changeOrigin: true }));
    app.use(proxy('/services/**/*', { target: 'https://next.kbase.us', changeOrigin: true }));
    app.use(proxy('/dynserv/**/*', { target: 'https://next.kbase.us', changeOrigin: true }));
    app.use(morgan('combined'));
};