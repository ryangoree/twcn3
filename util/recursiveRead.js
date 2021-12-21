const fs = require('fs')
const path = require('path')

async function recursiveRead(entryPath, onFileContent, onError) {
  try {
    const stat = await fs.promises.stat(entryPath)
    if (stat.isFile()) {
      const fileContent = await fs.promises.readFile(entryPath, 'utf8')
      onFileContent(fileContent, entryPath)
    }
    else if (stat.isDirectory()) {
      const childNames = await fs.promises.readdir(entryPath)
      for (const childName of childNames) {
        const childPath = path.join(entryPath, childName)
        await recursiveRead(childPath, onFileContent, onError)
      }
    }
  } catch (err) {
    onError(err)
  }
}

module.exports = recursiveRead
