/* eslint-disable consistent-return */
const fs = require('fs-extra');
const path = require('path');

/**
 * Applies variables to a string and throws an error if a required variable is not set
 * @throws on unmet required variable
 *
 * @param {string} string   Input string
 * @param {object} vars     Key value pairs
 */
const applyVars = (string, vars) => {
  let output = string;

  // Replace variables
  Object.keys(vars).forEach((key) => {
    const replacement = vars[key];
    if (typeof replacement !== 'string') return;
    const pattern = new RegExp(`{{@\\!?${key}}}`, 'g');
    output = output.replace(pattern, replacement);
  });

  // Check for unset required variable patterns
  const requiredPattern = new RegExp('\\{\\{@!([^}]+)\\}\\}', 'g');
  const matches = output.match(requiredPattern);
  if (matches) {
    throw new Error(matches[0].replace(requiredPattern, '$1'));
  }

  return output;
};

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
      if (item === Object(item)) {
        return parseLayer(path.resolve(pathKey, applyVars(itemKey, variables).replace('..', '')), item);
      }

      // Skip invalid config lines
      if (typeof item !== 'string' || Array.isArray(item)) return;

      // Construct file path
      let filePath;
      try {
        filePath = path.resolve(pathKey, applyVars(itemKey, variables).replace('..', ''));
      } catch (e) {
        errors.variables.push(e.message);
      }

      // Construct file content
      let fileContent;
      try {
        fileContent = applyVars(Array.isArray(item) ? item.join('\n') : item, variables);
      } catch (e) {
        errors.variables.push(e.message);
      }

      // Create build file entry
      if (filePath && fileContent) {
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
