const fs = require('fs')
const { parseTypesByClassName } = require('./util/parseTypes')
const recursiveRead = require('./util/recursiveRead')

module.exports = async function ({ types, src, alias }) {
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
  const utilFunctions = await parseTypesByClassName(types)

  const getUtilFunction = (className) =>
    utilFunctions[className.replace(/(^.*:|[`'"])/g, '')]

  const warnOfMissingFunction = (className, filePath) =>
    console.warn(
      `WARNING: Couldn't find utility function for ${className} in ${filePath}.`
    )

  const getStringFromClassNamesObject = (classNamesObject) => {
    const entries = Object.entries(classNamesObject)
    return entries.length
      ? `{ ${entries.map((pair) => pair.join(': ')).join(', ')} }`
      : ''
  }

  await recursiveRead(
    src,
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
          const mappedClassNames = {}
          const noFnClassNames = []
          const conditionalClassNames = {}
          const noFnConditionalClassNames = {}
          const classNames = match
            .split(
              /((?<!\([^)]*)\B\s*{[^}]+}\s*\B(?!\))|(?<!(\B[`'"][^`'"]*|{[^}]*)),(?![^`'"}]*[`'}"]\B\b))/
            )
            .filter((className) => className && /\w/.test(className))
            .map((className) =>
              className.replace(/(^\s*\[?|[\r\n]+|\s*\]?$)/g, '')
            )

          for (const className of classNames) {
            // string
            if (/^[`'"].*[`'"]$/.test(className)) {
              const cleanedClassName = className.trim()
              const functionName = getUtilFunction(cleanedClassName)
              if (functionName) {
                namedImports.push(functionName)
                mappedClassNames[functionName] =
                  mappedClassNames[functionName] || []
                mappedClassNames[functionName].push(cleanedClassName)
                fileUpdated = true
                functionUpdated = true
              } else {
                warnOfMissingFunction(cleanedClassName, filePath)
                noFnClassNames.push(className)
              }
            }

            // object
            else if (/^{.*}$/.test(className)) {
              className
                .replace(/(^\s*{\s*|\s*}\s*$)/g, '')
                .split(/(?<=\b"[^"]*),/)
                .filter((entry) => entry && /\w/.test(entry))
                .forEach((entry) => {
                  const [className, condition] = entry.split(
                    /(?!\B"[^`'"]*):(?![^`'"]*"\B)/
                  )
                  const cleanedClassName = className.trim()
                  const functionName = getUtilFunction(cleanedClassName)
                  if (functionName) {
                    namedImports.push(functionName)
                    conditionalClassNames[functionName] =
                      conditionalClassNames[functionName] || {}
                    conditionalClassNames[functionName][cleanedClassName] =
                      condition || cleanedClassName
                    fileUpdated = true
                    functionUpdated = true
                  } else {
                    warnOfMissingFunction(cleanedClassName, filePath)
                    noFnConditionalClassNames[cleanedClassName] =
                      condition || cleanedClassName
                  }
                })
            }

            // function or variable
            else if (
              !/[`'"]/.test(className) ||
              !/(?<!\([^)]*)\B([`'"]).+?\1\B(?![^)]*\))/.test(className)
            ) {
              noFnClassNames.push(className)
            }

            // some other inline condition such as:
            //   - x ? 'x' : 'y'
            //   - x ?? 'y'
            //   - x || 'y'
            else {
              noFnClassNames.push(
                className.replace(
                  /(?<!\([^)]*)\B([`'"]).+?\1\B(?![^)]*\))/g,
                  (match) => {
                    const cleanedClassName = match.trim()
                    const functionName = getUtilFunction(cleanedClassName)
                    if (functionName) {
                      namedImports.push(functionName)
                      fileUpdated = true
                      functionUpdated = true
                      return `${functionName}(${cleanedClassName})`
                    } else {
                      warnOfMissingFunction(cleanedClassName, filePath)
                      return match
                    }
                  }
                )
              )
            }
          }
          if (functionUpdated) updatedFunctionCount++
          const newClassNames = [noFnClassNames.join(', ')]
          newClassNames.push(
            getStringFromClassNamesObject(noFnConditionalClassNames)
          )
          const mappedEntries = Object.entries(mappedClassNames)
          if (mappedEntries.length) {
            newClassNames.push(
              mappedEntries
                .map(
                  ([functionName, classNames]) =>
                    `${functionName}(${classNames.join(', ')})`
                )
                .join(', ')
            )
          }
          const conditionalEntries = Object.entries(conditionalClassNames)
          if (conditionalEntries.length) {
            newClassNames.push(
              conditionalEntries
                .map(
                  ([functionName, classNamesObj]) =>
                    `${functionName}(${getStringFromClassNamesObject(
                      classNamesObj
                    )})`
                )
                .join(', ')
            )
          }
          return newClassNames.filter(Boolean).join(', ')
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
