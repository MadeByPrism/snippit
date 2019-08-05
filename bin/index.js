#!/usr/bin/env node

/* eslint-disable no-console */

process.env.SNIPPIT_VIA_CLI = true;

const chalk = require('chalk');
const yargs = require('yargs');
const Snippit = require('../index');

const { argv } = yargs.usage('snippit <snippet-name> <name> [variables]')
  .example('snippit example filename --variable="foo"', 'Builds snippet files with assigned name and variable')
  .help('h')
  .alias('h', 'help');

(() => {
  // Snippet config name
  const snippetName = argv._[0];
  if (!snippetName) {
    console.log(chalk.red('Missing snippet name'));
    process.exit(0);
  }

  // Core name variable
  const name = argv._[1];
  if (!name) {
    console.log(chalk.red('Missing name variable'));
    process.exit(0);
  }

  // Extract real variables from CLI arguments
  const variables = Object.assign(argv, { name });
  delete variables._;
  delete variables.$0;

  // Run Snippit
  Snippit(snippetName, process.cwd(), variables);
})();
