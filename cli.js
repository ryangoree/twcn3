#!/usr/bin/env node

const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')
const path = require('path')
const convert = require('./index')

yargs(hideBin(process.argv))
  .command(
    'convert',
    'Convert your tailwindcss-classnames implementation to use the new utitlity functions introduced in v3.',
    (yargs) => {
      return yargs
        .option('types', {
          alias: 't',
          describe: 'The path to your built tailwindcss-classnames types file.',
          default: path.join(__dirname, 'types.ts'),
        })
        .option('dir', {
          alias: 'd',
          describe: 'The path to the directory with the files to be converted.',
          default: 'src',
        })
        .option('alias', {
          alias: 'a',
          describe:
            'The name used when importing the classnames function from your type file.',
          default: 'tw',
        })
        // wip
        // .option('verbose', {
        //   alias: 'v',
        //   type: 'boolean',
        //   description: 'Run with verbose logging.',
        // })
    },
    (argv) => convert(argv)
  )
  .help().argv
