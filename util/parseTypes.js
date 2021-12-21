const fs = require('fs')
const path = require('path')

function getClassNames(content, type) {
  const claseNamesRegExp = new RegExp(`(?<=${type}\\s?=)(\\s|.)*?(?=\\n{2})`)
  const classNamesMatch = content.match(claseNamesRegExp)
  if (!classNamesMatch || !classNamesMatch[0]) {
    return null
  }
  return classNamesMatch[0]
    .split('|')
    .filter((className) => /\w/.test(className))
    .map((className) => className.replace(/(\s|'|")/g, ''))
}

module.exports.parseTypesByClassName = async function (typesPath) {
  try {
    const typesFile = await fs.promises.readFile(
      path.resolve(typesPath),
      'utf8'
    )
    const utilFunctionsMatch = typesFile.match(/(?<=TW\s*=\s*\{[\r\n]+)[^\}]+/)
    if (!utilFunctionsMatch || !utilFunctionsMatch[0]) {
      throw new Error(`Can't find utility functions definition.`)
    }
    return utilFunctionsMatch[0]
      .split(',')
      .filter((className) => /\w/.test(className))
      .reduce((utilityFunction, functionString) => {
        const functionName = functionString.replace(/\s+/g, '')
        const typesRegExp = new RegExp(
          `(?<=${functionName}:\\s*TUtilityFunction\\<)[^>]+`
        )
        const typeMatch = typesFile.match(typesRegExp)
        if (!typeMatch || !typeMatch[0]) {
          console.warn(`WARNING: Couldn't find classnames for ${functionName}.`)
          return utilityFunction
        }
        const classNames = getClassNames(typesFile, typeMatch[0])
        for (const className of classNames) {
          utilityFunction[className] = functionName
        }
        return utilityFunction
      }, {})
  } catch (err) {
    console.error(err)
  }
}
