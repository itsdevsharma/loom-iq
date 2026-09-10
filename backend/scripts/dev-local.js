process.env.STORAGE_DRIVER = 'file';
const { spawn } = require('node:child_process');
const child = spawn(process.execPath, [require.resolve('nodemon/bin/nodemon.js'), 'server.js'], { stdio: 'inherit', env: process.env, cwd: require('node:path').join(__dirname, '..') });
child.on('exit', code => { process.exitCode = code || 0; });
