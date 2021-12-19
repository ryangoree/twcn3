#!/usr/bin/env node

const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')
const path = require('path')
const convert = require('./index')

yargs(hideBin(process.argv))
  .command(
    'convert [types-path]',
    'Convert your tailwindcss-classnames implementation to use the new utitlity functions introduced in v3.',
    (yargs) => {
      return yargs
        .positional('types-path', {
          type: 'string',
          describe: 'The built types file',
          default: path.join(__dirname, 'types.ts'),
        })
        .option('dir', {
          alias: 'd',
          describe: 'The directory with the files to be converted',
          default: 'src',
        })
        .option('alias', {
          alias: 'a',
          describe:
            'The name used when importing classnames from your type file',
          default: 'classnames',
        })
        .option('verbose', {
          alias: 'v',
          type: 'boolean',
          description: 'Run with verbose logging',
        })
    },
    (argv) => convert(argv)
  )
  .help().argv
