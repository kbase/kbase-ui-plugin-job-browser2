/*eslint-env node */
/*eslint strict: ["error", "global"] */
'use strict';
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs-extra'));
const path = require('path');
const tar = require('tar');

async function copyBuildFiles(rootDir) {
    const root = rootDir.split('/');
    const source = root.concat(['react-app', 'build']).join('/');
    const dest = root.concat(['dist', 'plugin', 'iframe_root']).join('/');
    try {
        await fs.removeAsync(dest);
    } catch (ex) {
        console.warn('WARNING removing dest', ex.message);
    }
    await fs.ensureDirAsync(dest);
    await fs.copyAsync(source, dest);
}

async function copyPluginTemplate(rootDir) {
    const root = rootDir.split('/');
    const source = root.concat(['plugin']).join('/');
    const dest = root.concat(['dist']).join('/');
    try {
        await fs.removeAsync(dest);
    } catch (ex) {
        console.warn('WARNING removing dest', ex.message);
    }
    await fs.ensureDirAsync(dest);
    await fs.copyAsync(source, dest);
}

async function taritup(rootDir) {
    const dir = 'dist';
    const dest = rootDir.concat(['dist.tgz']).join('/');
    console.log('tarring from ' + dir + ', to ' + dest);
    return tar.c({
        gzip: true,
        file: dest,
        portable: true,
        cwd: rootDir.join('/')
    }, [
        dir
    ]);
}

async function main() {
    const cwd = process.cwd().split('/');
    cwd.push('..');
    const projectPath = path.normalize(cwd.join('/'));
    console.log(`Project path: ${projectPath}`);

    // Copy files to dist.
    console.log('Copying files to dist...');
    await copyPluginTemplate(projectPath);
    await copyBuildFiles(projectPath);

    // Tar up dist
    console.log('tar-ing dist...');
    try {
        await taritup(projectPath.split('/'));
    } catch (ex) {
        console.error('Error tarring up dist! ' + ex.message);
    }
    console.log('done');
}



main();