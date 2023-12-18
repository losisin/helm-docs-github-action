import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import { getHelmDocs, installHelmDocs, findHelmDocs } from '../src/install'
import * as tc from '@actions/tool-cache'

jest.mock('os')
jest.mock('fs')
jest.mock('util')
jest.mock('@actions/tool-cache', () => ({
  downloadTool: jest.fn().mockResolvedValue('/mocked/path/tool.tgz'),
  find: jest.fn().mockReturnValue('/mocked/path/cachedTool'),
  extractTar: jest.fn().mockResolvedValue('/mocked/path/untarredTool'),
  cacheDir: jest.fn().mockResolvedValue('/mocked/path/cachedDir')
}))

const helmDocs = 'helm-docs'
const version = 'v1.11.3'

describe('getHelmDocs tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return the correct url for Windows_NT and arm64 arch', () => {
    const osType = 'Windows_NT'
    const osArch = 'arm64'
    const windowsURL = util.format(
      'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
      helmDocs,
      version,
      helmDocs,
      version.substring(1),
      osType,
      osArch
    )
    ;(os.type as jest.Mock).mockReturnValue(osType)
    ;(os.arch as jest.Mock).mockReturnValue(osArch)

    const result = getHelmDocs(version)

    expect(result).toBe(windowsURL)
  })

  it('should return the correct url for Linux and arm64 arch', () => {
    const osType = 'linux'
    const osArch = 'arm64'
    const windowsURL = util.format(
      'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
      helmDocs,
      version,
      helmDocs,
      version.substring(1),
      osType,
      osArch
    )
    ;(os.type as jest.Mock).mockReturnValue(osType)
    ;(os.arch as jest.Mock).mockReturnValue(osArch)

    const result = getHelmDocs(version)

    expect(result).toBe(windowsURL)
  })

  it('should return the correct url for MAC_OS and amd64 arch', () => {
    const osType = 'darwin'
    const osArch = 'amd64'
    const windowsURL = util.format(
      'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
      helmDocs,
      version,
      helmDocs,
      version.substring(1),
      osType,
      osArch
    )
    ;(os.type as jest.Mock).mockReturnValue(osType)
    ;(os.arch as jest.Mock).mockReturnValue(osArch)

    const result = getHelmDocs(version)

    expect(result).toBe(windowsURL)
  })
})

describe('installHelmDocs', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('installs helm-docs if it is not already cached', async () => {
    ;(os.type as jest.Mock).mockReturnValue('Linux')
    ;(tc.find as jest.Mock).mockReturnValue('')
    ;(tc.downloadTool as jest.Mock).mockResolvedValue('/downloads/tool.tgz')
    ;(fs.chmodSync as jest.Mock).mockReturnValue(null)
    ;(tc.extractTar as jest.Mock).mockResolvedValue('/extracts/tool')
    ;(tc.cacheDir as jest.Mock).mockResolvedValue('/cached/tool')
    ;(fs.readdirSync as jest.Mock).mockReturnValue(['other', 'helm-docs'])
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false })

    const result = await installHelmDocs(version)

    expect(result).toBe('/cached/tool/helm-docs')
    expect(tc.find).toHaveBeenCalledWith(helmDocs, version)
    expect(tc.downloadTool).toHaveBeenCalledWith(getHelmDocs(version))
    expect(fs.chmodSync).toHaveBeenCalledWith('/downloads/tool.tgz', '777')
    expect(tc.extractTar).toHaveBeenCalledWith('/downloads/tool.tgz')
    expect(tc.cacheDir).toHaveBeenCalledWith(
      '/extracts/tool',
      helmDocs,
      version
    )
  })

  it('finds helm-docs from the cache if it is already cached', async () => {
    ;(os.type as jest.Mock).mockReturnValue('Linux')
    ;(tc.find as jest.Mock).mockReturnValue('/cached/tool')
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false })

    const result = await installHelmDocs(version)

    expect(result).toBe('/cached/tool/helm-docs')
    expect(tc.find).toHaveBeenCalledWith(helmDocs, version)
    expect(tc.downloadTool).not.toHaveBeenCalled()
    expect(tc.extractTar).not.toHaveBeenCalled()
    expect(tc.cacheDir).not.toHaveBeenCalled()
  })
})

describe('findHelmDocs', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })
  it('finds the correct file in the directory', () => {
    ;(os.type as jest.Mock).mockReturnValue('Darwin')
    ;(fs.readdirSync as jest.Mock).mockReturnValue(['helm-docs'])
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false })

    const result = findHelmDocs('/some/dir')

    expect(result).toBe('/some/dir/helm-docs')
    expect(fs.chmodSync).toHaveBeenCalledWith('/some/dir', '777')
  })

  it('ignores subdirectories', () => {
    const directoryName = 'a_subdirectory'
    const helmDocsFolder = '/some/dir'

    ;(os.type as jest.Mock).mockReturnValue('Linux')
    ;(fs.readdirSync as jest.Mock).mockReturnValue([directoryName])
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true })

    expect(() => findHelmDocs(helmDocsFolder)).toThrow(
      `helm-docs executable not found in path: ${helmDocsFolder}`
    )
    expect(fs.statSync).toHaveBeenCalledWith(
      path.join(helmDocsFolder, directoryName)
    )
    expect(fs.statSync).toHaveBeenCalledTimes(1)
  })

  it('throws error when plugin file is not found', () => {
    ;(os.type as jest.Mock).mockReturnValue('Windows_NT')
    ;(fs.readdirSync as jest.Mock).mockReturnValue(['notHelmDocs'])
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false })

    expect(() => findHelmDocs('/some/dir')).toThrow(
      'helm-docs executable not found in path: /some/dir'
    )
  })
})
