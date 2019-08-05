/* eslint-disable consistent-return */
const fs = require('fs-extra');
const path = require('path');

/**
 * Validates a snippet config and builds file generation payload
 *
 * @param {object} snippetConfig
 * @param {string} destinationPath
 * @param {object} variables
 * @returns {object} { errors: { conflicts: [], variables: [] }, files: {} }
 */
module.exports = (snippetConfig, destinationPath, variables) => {
  const errors = {
    variables: [],
    conflicts: [],
  };
  const buildFiles = {};

  /**
   * Applies variables to a string and adds an error if a required variable is not set
   *
   * @param {string} string   Input string
   * @param {object} vars     Key value pairs
   * @param {string}
   */
  const applyVars = (string, vars) => {
    let output = string;

    // Replace variables
    Object.keys(vars).forEach((key) => {
      const replacement = vars[key];
      if (typeof replacement !== 'string') return;
      const pattern = new RegExp(`{{@\\??${key}}}`, 'g');
      output = output.replace(pattern, replacement);
    });

    // Check for unset non-optional variable patterns
    const requiredPattern = new RegExp('\\{\\{@([^?][^}]*)\\}\\}', 'g');
    const matches = output.match(requiredPattern);
    if (matches) {
      matches.forEach((m) => {
        const reqVar = m.replace(requiredPattern, '$1');
        if (!errors.variables.includes(reqVar)) errors.variables.push(reqVar);
      });
    }

    // Scrub remaining optionals from output
    return output.replace(/\{\{@\?[^}]*\}\}/g, '');
  };

  /**
   * Recursive layer parser
   *
   * @param {string} pathKey Current path segment
   * @param {object} layerContents
   * @returns {void}
   */
  const parseLayer = (pathKey, layerContents) => {
    Object.keys(layerContents).forEach((itemKey) => {
      const item = layerContents[itemKey];

      // Parse next layer if item is a directory
      if (item === Object(item) && !Array.isArray(item)) {
        return parseLayer(path.resolve(pathKey, applyVars(itemKey, variables).replace('..', '')), item);
      }

      // Skip invalid config lines
      if (typeof item !== 'string' && !Array.isArray(item)) return;

      // Construct file path
      const filePath = path.resolve(pathKey, applyVars(itemKey, variables).replace('..', ''));

      // Construct file content
      const fileContent = applyVars(Array.isArray(item) ? item.join('\n') : item, variables);

      // Create build file entry
      if (filePath && fileContent && !errors.variables.length) {
        buildFiles[filePath] = fileContent;
      }
    });
  };

  // Begin recursive file generation payload
  parseLayer(destinationPath, snippetConfig);

  // Test for file overwrites
  Object.keys(buildFiles).forEach((filePath) => {
    if (fs.pathExistsSync(filePath)) {
      errors.conflicts.push(filePath);
    }
  });

  // Generate output payload
  const output = {
    errors: null,
    files: null,
  };
  if (errors.variables.length) output.errors = Object.assign(output.errors || {}, { variables: errors.variables });
  if (errors.conflicts.length) output.errors = Object.assign(output.errors || {}, { conflicts: errors.conflicts });
  if (!output.errors) output.files = buildFiles;
  return output;
};
