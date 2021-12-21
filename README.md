# twcn3

A cli utility for converting codebases upgrading from [tailwindcss-classnames](https://www.npmjs.com/package/tailwindcss-classnames) v2 to v3.

In tailwindcss-classnames v3, you're required to use [new utility functions](https://github.com/muhammadsammy/tailwindcss-classnames/issues/293) to compose your classes rather than a single `classname` or `tw` function. Depending on the size of your codebase, this can be an incredibly time-consuming task.

This utility does it with one command:

```bash
npx twcn3 convert
```

## Multiple Directories and/or files

```bash
npx twcn3 convert -s layouts
npx twcn3 convert -s pages
npx twcn3 convert -s index.js
```

## Custom Config

```bash
npx twcn3 convert -t <path-to-built-types-file>
```

## Custom Import Alias

```jsx
// sample.tsx

import tailwind from 'tailwindcss-classnames'
```

```bash
npx twcn3 convert -a tailwind
```

## All Options

- **`--version`** - Show version number
- **`--help`** - Show help
- **`-t`, `--types <path-to-types>`** - The path to your built tailwindcss-classnames types file. Only required if you have custom classes.
- **`-s`, `--src <path-to-src>`** - The path to a directory or file to be converted.
(**default: `src`**)
- **`-a`, `--alias <function-name>`** - The name used when importing the classnames function from your type file. (i.e. <code>import <strong>tw</strong> from 'tailwindcss-classnames'</code>) (**default: `tw`**)