const fs = require('fs')
const mapFnsToCns = require('./util/mapFnsToCns')
const recursiveRead = require('./util/recursiveRead')

module.exports = async function ({ types, dir, alias }) {
  let updatedFileCount = 0
  let updatedFunctionCount = 0

  // get all functions by className in and object
  // example: {
  //   ...
  //   'flex': 'display',
  //    ...
  //   'text-black': 'textColor',
  //   'text-white': 'textColor',
  //   ...
  // }
  const utilFunctions = await mapFnsToCns(types)

  await recursiveRead(
    dir,
    async (file, filePath) => {
      const namedImports = []
      const classNamesRegExp = new RegExp(
        `(?<=${alias}\\()([^()]|\\([^()]+\\))+(?=\\))`,
        'g'
      )
      const importRegExp = new RegExp(`(?<=import).*?${alias}(.|\n)*?(?=from)`)
      let fileUpdated = false
      const newContent = file

        // replace single classname function calls with utility functions
        // example:
        //   this: classnames("flex", "text-black", "hover:text-black")
        //   becomes: classnames(display("flex"), textColor("text-black", "hover:text-black"))
        .replace(classNamesRegExp, (match) => {
          let functionUpdated = false
          const noFunctionClassNames = []
          const classNameReplaceRegExp = /(^[^\w(]+|[^\w)]+$)/g
          const classNames = match
            .split(',')
            .filter((className) => {
              if (!/^[^\w(]*["']/.test(className)) {
                noFunctionClassNames.push(
                  className.replace(classNameReplaceRegExp, '')
                )
                return false
              }
              return true
            })
            .map((className) => className.replace(classNameReplaceRegExp, ''))
          const mappedClassNames = classNames.reduce(
            (classNames, className) => {
              const functionName = utilFunctions[className.replace(/.*:/, '')]
              if (!functionName) {
                console.warn(
                  `WARNING: Couldn't find utility function for ${className} in ${filePath}.`
                )
                noFunctionClassNames.push(className)
                return classNames
              } else {
                fileUpdated = true
                functionUpdated = true
              }
              namedImports.push(functionName)
              classNames[functionName] = classNames[functionName] || []
              classNames[functionName].push(className)
              return classNames
            },
            {}
          )
          if (functionUpdated) updatedFunctionCount++
          return Object.entries(mappedClassNames).reduce(
            (str, [functionName, classNames]) =>
              (str +=
                (str.length ? ', ' : '') +
                `${functionName}("${classNames.join('", "')}")`),
            noFunctionClassNames.join(', ')
          )
        })

        // add required util functions to imports
        // example:
        //   this: import tw, { TArg } from ...
        //   becomes: import tw, { TArg, display, textColor } from ...
        .replace(importRegExp, (match) => {
          const namedImportsMatch = match.match(/(?<={)[^}]+(?=})/)
          let existingNamedImports = []
          if (namedImportsMatch && namedImportsMatch[0]) {
            existingNamedImports = namedImportsMatch[0]
              .split(',')
              .map((namedImport) => namedImport.replace(/\s+/g, ''))
          }
          return ` tw, { ${Array.from(
            new Set([...existingNamedImports, ...namedImports])
          ).join(', ')} } `
        })
      if (fileUpdated) updatedFileCount++
      await fs.promises.writeFile(filePath, newContent, {
        encoding: 'utf8',
        flag: 'w',
      })
    },
    (err) => {
      console.error(err)
    }
  )
  console.log(
    `Updated ${updatedFunctionCount} instances of ${alias}() in ${updatedFileCount} files`
  )
}
