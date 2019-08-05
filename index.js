/* eslint-disable no-console, consistent-return */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const locateParentFile = require('./lib/locateParentFile');
const maxPath = require('./lib/maxPath');
const processSnippetConfig = require('./lib/processSnippetConfig');

module.exports = (snippetName, destination, variables = {}) => {
  const isCli = process.env.SNIPPIT_VIA_CLI;
  const maxSearch = maxPath(destination);

  // Locate snippet config
  if (isCli) {
    console.log(`Locating Snippit config for ${chalk.cyan(`"${snippetName}"`)}...`);
  }

  let snippetConfig;
  let snippetConfigPath;
  const locateSnippetConfig = (_path) => {
    // Locate next highest config
    const configFile = locateParentFile('snippits.json', _path);
    if (!configFile.path) {
      return false;
    }

    // Validate config and carry on up if specific snippit not found
    const configObj = configFile.parseJson();
    // eslint-disable-next-line no-prototype-builtins
    if (!configObj || !configObj.hasOwnProperty(snippetName)) {
      // Prevent looping on top level config none matches
      const nextPath = path.resolve(path.dirname(configFile.path), '../');
      if (nextPath === maxSearch) {
        return false;
      }

      return locateSnippetConfig(nextPath);
    }

    snippetConfig = configObj[snippetName];
    snippetConfigPath = configFile.path;
  };

  locateSnippetConfig(destination);

  if (!snippetConfig) {
    if (isCli) {
      console.log(chalk.red(`\nCould not find a snippet config for "${snippetName}"`));
      process.exit(0);
    }
    return false;
  } if (isCli) {
    console.log(`  Using config: ${chalk.grey(`${snippetConfigPath}`)}`);
  }

  // Process snippet build data
  const snippet = processSnippetConfig(snippetConfig, destination, variables);

  // Handle errors
  if (snippet.errors) {
    if (snippet.errors.variables) {
      if (isCli) {
        console.log(chalk.red(`\nThe following variables on "${snippetName}" are required:`));
        console.log(`  ${snippet.errors.variables.join('\n  ')}`);
        console.log(chalk.grey(`${snippetConfigPath}`));
      }
    }

    if (snippet.errors.conflicts) {
      if (isCli) {
        console.log(chalk.red(`\nThe following files from "${snippetName}" already exist:`));
        console.log(`  ${snippet.errors.conflicts.join('\n  ')}`);
        console.log(chalk.grey(`${snippetConfigPath}`));
      }
    }

    if (isCli) process.exit(0);
    return snippet;
  }

  // Build files if no errors
  try {
    if (isCli) {
      const total = Object.keys(snippet.files).length;
      console.log(`\nGenerating ${total} file${total === 1 ? '' : 's'}...`);
    }
    Object.keys(snippet.files).forEach((filePath) => {
      fs.outputFileSync(filePath, snippet.files[filePath]);
      if (isCli) console.log(chalk.green(`  ✔ ${filePath}`));
    });
  } catch (e) {
    if (isCli) {
      console.log(chalk.red('An error occurred while generating snippet files:'));
      console.log(chalk.red(e.message));
      process.exit(0);
    }
    throw e;
  }

  return snippet;
};
