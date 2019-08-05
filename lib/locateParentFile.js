const path = require('path');

const maxPath = require('./maxPath');
const fileRead = require('./fileRead');

/**
 * Locates first instance of a file in any parent directory
 *
 * @param {string} [filename=`package.json`]
 * @param {string} [startPath] Defaults to process.cwd()
 * @returns {fileRead} False if not found
 */
module.exports = (
  filename = 'package.json',
  startPath = null,
) => {
  let cwd = startPath || process.cwd();

  // Define maximum search level
  const maxSearch = maxPath(cwd);

  // Recursive file search
  const search = () => {
    // Check file exists
    const searchPath = path.join(cwd, filename);
    const file = fileRead(searchPath);
    if (file.path) {
      return Object.assign({
        path: searchPath,
      }, file);
    }

    // Update current search path
    cwd = path.join(cwd, '..');

    // Break out of max level search
    if (
      cwd === maxSearch
      || cwd === '.'
      || cwd === '..'
    ) {
      return false;
    }

    return search();
  };

  return search();
};
