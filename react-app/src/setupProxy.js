// const proxy = require('http-proxy-middleware');
// const morgan = require('morgan');

// module.exports = function (app) {
//     app.use(proxy('/services/service_wizard', { target: 'http://localhost:3002', changeOrigin: true }));
//     app.use(proxy('/services/**/*', {
//         target: 'https://ci.kbase.us',
//         changeOrigin: true
//     }));
//     app.use(proxy('/dynserv/internal/JobBrowserBFF', {
//         target: 'http://localhost:5000',
//         changeOrigin: true
//     }));
//     app.use(proxy('/dynserv/**/*', { target: 'https://ci.kbase.us', changeOrigin: true }));
//     app.use(morgan('combined'));
// };

const {createProxyMiddleware} = require("http-proxy-middleware");
const morgan = require("morgan");
const DEPLOY_ENV = process.env.ENV || "ci";
let HOST;

if (DEPLOY_ENV === "prod") {
    HOST = "kbase.us";
} else {
    HOST = `${DEPLOY_ENV}.kbase.us`;
}

module.exports = function (app) {
    // Proxy service wizard requests locally.
    // app.use(
    //     '/services/service_wizard',
    //     createProxyMiddleware({ 
    //     target: 'http://localhost:3002', 
    //     changeOrigin: true,
    //     secure: false
    // }));
    app.use(
        "/services/", 
        createProxyMiddleware({
            target: `https://${HOST}`,
            changeOrigin: true,
            secure: false
        })
    );
    // app.use(
    //     "/dynserv/JobBrowserBFF", 
    //     createProxyMiddleware({
    //         target: `https://${HOST}`,
    //         changeOrigin: true,
    //         secure: false
    //     })
    // );
    app.use(
        "/dynserv/", 
        createProxyMiddleware({
            target: `https://localhost:5000`,
            changeOrigin: true,
            secure: false
        })
    );

    app.use(morgan("combined"));
};

