const path = require('path');
const CracoAntDesignPlugin = require('craco-antd');

const esModules = ['kbase-ui-lib'].join('|');

module.exports = {
    jest: {
        babel: {
            addPresets: true,
            addPlugins: true,
            configure: (jestConfig, { env, paths, resolve, rootDir }) => {
                // jestConfig.transformIgnorePatterns = [`<rootDir>/node_modules/(?!${esModules})`];
                jestConfig.transformIgnorePatterns = ['[/\\\\]node_modules[/\\\\](?!kbase-ui-lib|antd/).+\\.js$'];

                return jestConfig;
            }
        }
    },
    plugins: [
        {
            plugin: CracoAntDesignPlugin,
            options: {
                customizeThemeLessPath: path.join(__dirname, 'src/custom/style/antd/theme.less')
            }
        }
    ]
};
