const proxy = require("http-proxy-middleware");
const morgan = require("morgan");
const DEPLOY_ENV = "next";
let HOST;

if (DEPLOY_ENV === "prod") {
    HOST = "kbase.us";
} else {
    HOST = `${DEPLOY_ENV}.kbase.us`;
}

module.exports = function (app) {
    // app.use(proxy('/services/service_wizard', { target: 'http://localhost:3001', changeOrigin: true }));
    app.use(
        proxy("/services/**/*", {
            target: `https://${HOST}`,
            changeOrigin: true,
            secure: false
        })
    );
    app.use(
        proxy("/dynserv/**/*", {
            target: `https://${HOST}`,
            changeOrigin: true,
            secure: false
        })
    );
    app.use(morgan("combined"));
};
