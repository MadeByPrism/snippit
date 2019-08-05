#!/usr/bin/env node

/* eslint-disable no-console */

process.env.SNIPPIT_VIA_CLI = true;

const chalk = require('chalk');
const path = require('path');
const yargs = require('yargs');
const Snippit = require('../index');

const { argv } = yargs.usage('snippit <snippet-name> <[path/]name> [variables]')
  .example('snippit exampleSnippet Name --variable="foo"', 'Builds snippet files with assigned name and variable')
  .example('snippit exampleSnippet path/to/write/Name', 'Builds snippet files at path with assigned name')
  .help('h')
  .alias('h', 'help');

(() => {
  // Snippet config name
  const snippetName = argv._[0];
  if (!snippetName) {
    console.log(chalk.red('Missing snippet name'));
    process.exit(0);
  }

  // Destination path & core name variable
  const pathName = argv._[1];
  if (!pathName) {
    console.log(chalk.red('Missing name variable'));
    process.exit(0);
  }

  // Parse path & name
  const pathParts = pathName.match(/(.*?)([^/]+)$/);
  if (!pathParts) {
    console.log(chalk.red(`Missing name from end of path: ${pathName}`));
    process.exit(0);
  }

  if (pathParts[1].match(/^\//)) {
    console.log(chalk.red(`Path must be relative: ${pathParts[1]}`));
    process.exit(0);
  }

  const destination = path.resolve(process.cwd(), pathParts[1]);
  const name = pathParts[2];

  // Extract real variables from CLI arguments
  const variables = Object.assign(argv, { name });
  delete variables._;
  delete variables.$0;

  // Run Snippit
  Snippit(snippetName, destination, variables);
})();
