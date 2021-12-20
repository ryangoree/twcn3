# twcn3

A cli utility for converting codebases upgrading from [tailwindcss-classnames](https://www.npmjs.com/package/tailwindcss-classnames) v2 to v3.

In tailwindcss-classnames v3, you're required to use [new utility functions](https://github.com/muhammadsammy/tailwindcss-classnames/issues/293) to compose your classes rather than a single `classname` or `tw` function. Depending on the size of your codebase, this can be an incredibly time-consuming task.

This utility does it with one command:

```bash
npx twcn3 convert
```

## Multiple Directories

```bash
npx twcn3 convert -d layouts
npx twcn3 convert -d pages
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
- **`-d`, `--dir <path-to-src>`** - The path to the directory with the files to be converted.
(**default: `src`**)
- **`-a`, `--alias <function-name>`** - The name used when importing the classnames function from your type file. (i.e. <code>import <strong>tw</strong> from 'tailwindcss-classnames.ts'</code>) (**default: `tw`**)