const fs = require('fs')
const path = require('path')

async function recursiveRead(dirPath, onFileContent, onError) {
  try {
    const childNames = await fs.promises.readdir(dirPath)
    for (const childName of childNames) {
      const childPath = path.join(dirPath, childName)
      const stat = await fs.promises.stat(childPath)
      if (stat.isFile()) {
        const fileContent = await fs.promises.readFile(childPath, 'utf8')
        onFileContent(fileContent, childPath)
      } else if (stat.isDirectory()) {
        await recursiveRead(childPath, onFileContent, onError)
      }
    }
  } catch (err) {
    onError(err)
  }
}

module.exports = recursiveRead
