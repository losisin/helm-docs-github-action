/**
 * Unit tests for src/install.ts
 *
 * Dependencies are mocked via __fixtures__ and jest.unstable_mockModule before
 * dynamically importing the module under test.
 */
import * as path from 'path'
import type { Stats } from 'fs'
import * as util from 'util'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as fs from '../__fixtures__/fs.js'
import * as os from '../__fixtures__/os.js'
import * as tc from '../__fixtures__/tool-cache.js'

function mockStats(isDirectory: boolean): Stats {
  return { isDirectory: () => isDirectory } as Stats
}

jest.unstable_mockModule('os', () => os)
jest.unstable_mockModule('fs', () => fs)
jest.unstable_mockModule('@actions/tool-cache', () => tc)

const { getHelmDocs, installHelmDocs, findHelmDocs } =
  await import('../src/install.js')

const helmDocsName = 'helm-docs'
const version = 'v1.14.2'

describe('getHelmDocs tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return the correct url for Windows_NT and arm64 arch', () => {
    const osType = 'Windows_NT'
    const osArch = 'arm64'
    const expectedUrl = util.format(
      'https://github.com/norwoodj/%s/releases/download/%s/%s_%s_%s_%s.tar.gz',
      helmDocsName,
      version,
      helmDocsName,
      version.substring(1),
      'Windows',
      osArch
    )
    os.type.mockReturnValue(osType)
    os.arch.mockReturnValue(osArch)

    const result = getHelmDocs(version)

    expect(result).toBe(expectedUrl)
  })

  it('should return the correct url for Linux and arm64 arch', () => {
    const osType = 'Linux'
    const osArch = 'arm64'
    const expectedUrl = util.format(
      'https://github.com/norwoodj/%s/releases/download/%s/%s_%s_%s_%s.tar.gz',
      helmDocsName,
      version,
      helmDocsName,
      version.substring(1),
      osType,
      osArch
    )
    os.type.mockReturnValue(osType)
    os.arch.mockReturnValue(osArch)

    const result = getHelmDocs(version)

    expect(result).toBe(expectedUrl)
  })

  it('should return the correct url for Darwin and x64 arch', () => {
    const osType = 'Darwin'
    const expectedUrl = util.format(
      'https://github.com/norwoodj/%s/releases/download/%s/%s_%s_%s_%s.tar.gz',
      helmDocsName,
      version,
      helmDocsName,
      version.substring(1),
      osType,
      'x86_64'
    )
    os.type.mockReturnValue(osType)
    os.arch.mockReturnValue('x64')

    const result = getHelmDocs(version)

    expect(result).toBe(expectedUrl)
  })
})

describe('installHelmDocs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('installs helm-docs if it is not already cached', async () => {
    os.type.mockReturnValue('Linux')
    tc.find.mockReturnValue('')
    tc.downloadTool.mockResolvedValue('/downloads/tool.tgz')
    fs.chmodSync.mockReturnValue(undefined)
    tc.extractTar.mockResolvedValue('/extracts/tool')
    tc.cacheDir.mockResolvedValue('/cached/tool')
    fs.readdirSync.mockReturnValue(['other', helmDocsName])
    fs.statSync.mockReturnValue(mockStats(false))

    const result = await installHelmDocs(version)

    expect(result).toBe(`/cached/tool/${helmDocsName}`)
    expect(tc.find).toHaveBeenCalledWith(helmDocsName, version)
    expect(tc.downloadTool).toHaveBeenCalledWith(getHelmDocs(version))
    expect(fs.chmodSync).toHaveBeenCalledWith('/downloads/tool.tgz', '777')
    expect(tc.extractTar).toHaveBeenCalledWith('/downloads/tool.tgz')
    expect(tc.cacheDir).toHaveBeenCalledWith(
      '/extracts/tool',
      helmDocsName,
      version
    )
  })

  it('finds helm-docs from the cache if it is already cached', async () => {
    os.type.mockReturnValue('Linux')
    tc.find.mockReturnValue('/cached/tool')
    fs.statSync.mockReturnValue(mockStats(false))

    const result = await installHelmDocs(version)

    expect(result).toBe(`/cached/tool/${helmDocsName}`)
    expect(tc.find).toHaveBeenCalledWith(helmDocsName, version)
    expect(tc.downloadTool).not.toHaveBeenCalled()
    expect(tc.extractTar).not.toHaveBeenCalled()
    expect(tc.cacheDir).not.toHaveBeenCalled()
  })
})

describe('findHelmDocs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('finds the correct file in the directory', () => {
    os.type.mockReturnValue('Darwin')
    fs.readdirSync.mockReturnValue([helmDocsName])
    fs.statSync.mockReturnValue(mockStats(false))

    const result = findHelmDocs('/some/dir')

    expect(result).toBe(`/some/dir/${helmDocsName}`)
    expect(fs.chmodSync).toHaveBeenCalledWith('/some/dir', '777')
  })

  it('ignores subdirectories', () => {
    const directoryName = 'a_subdirectory'
    const helmDocsFolder = '/some/dir'

    os.type.mockReturnValue('Linux')
    fs.readdirSync.mockReturnValue([directoryName])
    fs.statSync.mockReturnValue(mockStats(true))

    expect(() => findHelmDocs(helmDocsFolder)).toThrow(
      `helm-docs executable not found in path: ${helmDocsFolder}`
    )
    expect(fs.statSync).toHaveBeenCalledWith(
      path.join(helmDocsFolder, directoryName)
    )
    expect(fs.statSync).toHaveBeenCalledTimes(1)
  })

  it('throws error when executable is not found', () => {
    os.type.mockReturnValue('Windows_NT')
    fs.readdirSync.mockReturnValue(['notHelmDocs'])
    fs.statSync.mockReturnValue(mockStats(false))

    expect(() => findHelmDocs('/some/dir')).toThrow(
      'helm-docs executable not found in path: /some/dir'
    )
  })
})
