import * as os from 'os'
import * as path from 'path'
import * as util from 'util'
import * as fs from 'fs'
import * as tc from '@actions/tool-cache'

const helmDocs = 'helm-docs'

export function getHelmDocs(version: string): string {
  const osArch = os.arch()
  const osType = os.type()

  const platformKey = osType === 'Windows_NT' ? 'Windows' : osType
  const archKey = osArch === 'arm64' ? 'arm64' : 'x86_64'

  return util.format(
    'https://github.com/norwoodj/%s/releases/download/%s/%s_%s_%s_%s.tar.gz',
    helmDocs,
    version,
    helmDocs,
    version.substring(1),
    platformKey,
    archKey
  )
}

export async function installHelmDocs(version: string): Promise<string> {
  let cachedToolPath = tc.find(helmDocs, version)
  if (!cachedToolPath) {
    const toolDownloadPath = await tc.downloadTool(getHelmDocs(version))
    fs.chmodSync(toolDownloadPath, '777')
    const unTaredPath = await tc.extractTar(toolDownloadPath)
    cachedToolPath = await tc.cacheDir(unTaredPath, helmDocs, version)
  }

  const helmDocsPath = findHelmDocs(cachedToolPath)

  fs.chmodSync(helmDocsPath, '777')
  return helmDocsPath
}

export function findHelmDocs(helmDocsFolder: string): string {
  fs.chmodSync(helmDocsFolder, '777')
  const files = fs.readdirSync(helmDocsFolder)
  const executableExtension = os.type().startsWith('Win') ? '.exe' : ''
  const targetFileName = helmDocs + executableExtension

  const foundFiles = files.filter((file) => {
    const filePath = path.join(helmDocsFolder, file)
    if (fs.statSync(filePath).isDirectory()) {
      return false
    }
    return file === targetFileName
  })

  if (foundFiles.length === 0) {
    throw new Error(`helm-docs executable not found in path: ${helmDocsFolder}`)
  }

  return path.join(helmDocsFolder, foundFiles[0])
}
