const os = require('os');
const path = require('path');

module.exports = cwd => ((os.platform() === 'win32') ? `${cwd.split(path.sep)[0]}${path.sep}` : path.normalize('/'));
