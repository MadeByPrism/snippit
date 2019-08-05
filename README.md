# Snippit

A simple file snippet template management tool with flexible local configurations.

Snippit is developed by **Equals Labs** at [**Equals Collective**](https://equalscollective.com/).

## Getting started

#### For command line usage:
`$ npx snippit`
Refer to CLI usage

#### For use as a module:
`$ npm i snippit` or `$ yarn add snippit`
Refer to module usage

---

## CLI usage

```
npx snippit <snippet-name> <[path/]name> [variables]

<snippet-name>  Snippet name to look up
<path/name>     Write destination & core name variable
[variables]     Additional variables to pass to snippets

Options:
  --version   Show version number
  -h, --help  Show help

Examples:
  snippit exampleSnippet Name --variable="foo"
    Builds snippet files with assigned name and variable

  snippit exampleSnippet path/to/write/Name
    Builds snippet files at path with assigned name
```

All paths are relative to the current working directory and the `{{@name}}` variable is drawn from the last path segment.

If no segmented path is specified in the `<path/name>` the current directory is used.

---

## Module usage

Install package locally: `$ npm i snippit`

```javascript
const snippit = require('snippit');

const snippetName = `example`;
const destination = `target_directory`;
const variables = {
  foo: 'bar',
};

const { errors, files } = snippit(snippetName, destination, variables);
```

---

## Snippet configurations

Snippet configurations are stored in files named `snippits.json` as JSON objects. These contain the snippet generation directives for files and directories.

`snippit.json` configurations are read from the current working directory or destination working upwards until a configuration is found with the requested snippet name. This allows you to keep snippet configurations out of project files if needed.

Global snippet configurations can be placed in a `.snippit` directory in your user home directory under the naming structure: `SnippetName.snippit.json`. These will only be used if no matching parent `snippits.json` applies.

**Note:** Global snippet configurations may only contain one directive as their file name defines the snippet name.

#### Example `snippits.json` configuration

```jsonc
{
  // Top level object items are individually named snippet rules
  "test": {
    // This would create a named directory:
    "{{@name}}_example": {
      "{{@name}}.tsx": "export const {{@name}}Template = () => console.log('This is {{@name}}.tsx')",
      "{{@name}}.module.scss": ".{{@name}} { display: none; }",
      // A sub directory:
      "tests": {
        "{{@name}}.spec.ts": "// This is a test file for {{@name}}"
      }
    }
  },
  "func": {
    // Flat files can be created without containing directories
    "{{@name}}.tsx": "export const {{@name}}Func = () => console.log('This is {{@name}}.ts')"
  },
  "varfunc": {
    "{{@name}}.variable-test.tsx": [
      // Arrays may also be used in place of strings for multiline content
      "export const {{@name}}{{@var}} = () => {",
      "  console.log('Required variable: {{@var}}');",
      "  console.log('Optional variable: {{@?optionalVar}}');",
      "}"
    ]
  }
}
```

#### Example global `SnippetName.snippit.json` configuration

```jsonc
{
  "{{@name}}.{{@DATE:Y}}-{{@DATE:M}}-{{@DATE:D}}.ts": [
    "// Content for {{@name}}",
    "// Can include date/time variables: {{@TIME:H}}:{{@TIME:M}}"
  ]
}
```

#### Variables

`snippit.json` variables are denoted by a `{{@variableName}}` syntax.

By default, you are always provided with `{{@name}}` via the CLI but additional variables can be set to increase flexibility.

Variables are explicitly required by default. To make an optional variable prepend it with `?` (e.g. `{{@?variableName}}`). Unset optional variables are wiped from the output.

#### Predefined variables

Additional predefined variables are provided to allow for more dynamic file naming and content:

| Variable       | Output                       |
| -------------- | ---------------------------- |
| `{{@DATE:Y}}`  | Current full year: `YYYY`    |
| `{{@DATE:M}}`  | Current month: `MM`          |
| `{{@DATE:D}}`  | Current date: `DD`           |
| `{{@TIME:H}}`  | Current hour: `HH`           |
| `{{@TIME:M}}`  | Current minute: `MM`         |
| `{{@TIME:S}}`  | Current second: `SS`         |
| `{{@TIME:MS}}` | Current milliseconds: `SSSS` |

#### Caveats

Existing files will not be overwritten and will flag errors if found. However, existing directories will simply have any valid new files written to them.

**Note:** All file names are relative to the current directory or destination. For security, any potential breakout selectors (i.e `../`, `/`, `~/`) will be removed or normalized.