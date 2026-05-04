/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, fixtures export mock functions. Mocks are
 * registered with jest.unstable_mockModule before the module under test is
 * imported dynamically.
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import type { FileStatusResult, SimpleGit, StatusResult } from 'simple-git'
import * as core from '../__fixtures__/core.js'
import * as exec from '../__fixtures__/exec.js'
import * as installMod from '../__fixtures__/install-helm-docs.js'
import * as simpleGitModule from '../__fixtures__/simple-git.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)
jest.unstable_mockModule('simple-git', () => simpleGitModule)
jest.unstable_mockModule('../src/install.js', () => installMod)

function mockFileStatus(path: string): FileStatusResult {
  return { path, index: ' ', working_dir: 'M' }
}

function mockStatusResult(files: FileStatusResult[]): StatusResult {
  return {
    not_added: [],
    conflicted: [],
    created: [],
    deleted: [],
    modified: [],
    renamed: [],
    staged: [],
    files,
    ahead: 0,
    behind: 0,
    current: null,
    tracking: null,
    detached: false,
    isClean: () => files.length === 0
  }
}

const { run } = await import('../src/main.js')

describe('run function', () => {
  beforeEach(() => {
    exec.exec.mockResolvedValue(0)
    core.getInput.mockImplementation((name: string) => {
      const defaults: Record<string, string> = {
        'chart-search-root': '.',
        'values-file': 'values.yaml',
        'output-file': 'README.md',
        'template-files': 'README.md.gotmpl',
        'sort-values-order': '',
        version: ''
      }
      return defaults[name] ?? ''
    })
    core.getBooleanInput.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should handle success scenario', async () => {
    installMod.installHelmDocs.mockResolvedValue('/mocked/path')
    core.getInput.mockReturnValue('false')
    core.getBooleanInput.mockImplementation((inputName: string) => {
      return inputName == 'skip-version-footer' ? true : false
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(mockStatusResult([]))
    } as unknown as jest.Mocked<SimpleGit>
    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(installMod.installHelmDocs).toHaveBeenCalledTimes(1)
    expect(core.getInput).toHaveBeenCalledWith('values-file')
    expect(core.getInput).toHaveBeenCalledWith('chart-search-root')
    expect(core.getInput).toHaveBeenCalledWith('output-file')
    expect(core.getInput).toHaveBeenCalledWith('template-files')
    expect(core.getInput).toHaveBeenCalledWith('sort-values-order')
    expect(core.getBooleanInput).toHaveBeenCalledWith('fail-on-diff')
    expect(core.getBooleanInput).toHaveBeenCalledWith('skip-version-footer')
    expect(exec.exec).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith("'false' is up to date.")
  })

  it("should handle fail-on-diff === 'true'", async () => {
    installMod.installHelmDocs.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      'fail-on-diff': 'true',
      'output-file': 'README.md',
      'values-file': 'values.yaml',
      'chart-search-root': '.',
      'template-files': 'README.md.gotmpl'
    }

    core.getInput.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })
    core.getBooleanInput.mockImplementation((inputName: string) => {
      return inputName == 'fail-on-diff' ? true : false
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(
          mockStatusResult([mockFileStatus('./**/README.md')])
        ),
      diff: jest
        .fn<(args?: string | string[]) => Promise<string>>()
        .mockResolvedValue('- old \n+ new ')
    } as unknown as jest.Mocked<SimpleGit>

    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(installMod.installHelmDocs).toHaveBeenCalledTimes(1)
    expect(core.getInput).toHaveBeenCalledWith('values-file')
    expect(core.getInput).toHaveBeenCalledWith('chart-search-root')
    expect(core.getInput).toHaveBeenCalledWith('output-file')
    expect(core.getInput).toHaveBeenCalledWith('template-files')
    expect(core.getInput).toHaveBeenCalledWith('sort-values-order')
    expect(core.getBooleanInput).toHaveBeenCalledWith('fail-on-diff')
    expect(exec.exec).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)

    expect(core.setFailed).toHaveBeenCalledWith("'./**/README.md' has changed")
    expect(gitMock.diff).toHaveBeenCalledWith(['--', './**/README.md'])
    expect(core.info).toHaveBeenCalledWith(
      "Diff for './**/README.md':\n- old \n+ new "
    )
    expect(core.setFailed).toHaveBeenCalledWith("'./**/README.md' has changed")
  })

  it("should handle fail-on-diff === 'true' when diff fails", async () => {
    installMod.installHelmDocs.mockResolvedValue('/mocked/path')
    core.getBooleanInput.mockImplementation((inputName: string) => {
      return inputName == 'fail-on-diff' ? true : false
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(mockStatusResult([mockFileStatus('README.md')])),
      diff: jest
        .fn<(args?: string | string[]) => Promise<string>>()
        .mockRejectedValue(new Error('diff failed'))
    } as unknown as jest.Mocked<SimpleGit>

    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(gitMock.diff).toHaveBeenCalledWith(['--', 'README.md'])
    expect(core.info).toHaveBeenCalledWith("Unable to get diff for 'README.md'")
  })

  it("should handle git-push === 'true'", async () => {
    installMod.installHelmDocs.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      'git-push': 'true',
      'git-push-user-name': 'username',
      'git-push-user-email': 'user@email.com',
      'git-commit-message': 'message',
      'output-file': 'README.md',
      'values-file': 'values.yaml',
      'chart-search-root': '.',
      'template-files': 'README.md.gotmpl'
    }

    core.getInput.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })
    core.getBooleanInput.mockImplementation((inputName: string) => {
      return inputName == 'git-push' ? true : false
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(mockStatusResult([mockFileStatus('./README.md')])),
      addConfig: jest
        .fn<(key: string, value: string) => Promise<string>>()
        .mockResolvedValue(''),
      add: jest
        .fn<(files: string | string[]) => Promise<string>>()
        .mockResolvedValue(''),
      commit: jest
        .fn<(message: string) => Promise<string>>()
        .mockResolvedValue(''),
      push: jest.fn<() => Promise<string>>().mockResolvedValue('')
    } as unknown as jest.Mocked<SimpleGit>

    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(installMod.installHelmDocs).toHaveBeenCalledWith('v1.14.2')
    expect(core.getInput).toHaveBeenCalledWith('values-file')
    expect(core.getInput).toHaveBeenCalledWith('chart-search-root')
    expect(core.getInput).toHaveBeenCalledWith('output-file')
    expect(core.getInput).toHaveBeenCalledWith('template-files')
    expect(core.getInput).toHaveBeenCalledWith('sort-values-order')
    expect(core.getBooleanInput).toHaveBeenCalledWith('git-push')
    expect(core.getInput).toHaveBeenCalledWith('git-push-user-name')
    expect(core.getInput).toHaveBeenCalledWith('git-push-user-email')
    expect(core.getInput).toHaveBeenCalledWith('git-commit-message')
    expect(exec.exec).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)
    expect(gitMock.addConfig).toHaveBeenNthCalledWith(
      1,
      'user.name',
      'username'
    )
    expect(gitMock.addConfig).toHaveBeenNthCalledWith(
      2,
      'user.email',
      'user@email.com'
    )
    expect(gitMock.add).toHaveBeenCalledWith('./README.md')
    expect(gitMock.commit).toHaveBeenCalledWith('message')
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(core.setOutput).toHaveBeenCalledWith('helm-docs', '/mocked/path')
    expect(core.info).toHaveBeenLastCalledWith(
      "Pushed 'README.md' to the branch."
    )
  })

  it('sets failure if an error is thrown', async () => {
    const errorMessage = 'Something went wrong'

    installMod.installHelmDocs.mockResolvedValue('/mocked/path')
    core.getInput.mockImplementation(() => '')
    exec.exec.mockImplementation(() => {
      throw new Error(errorMessage)
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(errorMessage)
  })

  it("should handle both git-push and fail-on-diff set to 'false', but documentation generated", async () => {
    installMod.installHelmDocs.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      'git-push': 'false',
      'fail-on-diff': 'false',
      'output-file': 'README.md',
      'values-file': 'values.yaml',
      'chart-search-root': '.',
      'template-files': 'README.md.gotmpl'
    }

    core.getBooleanInput.mockReturnValue(false)
    core.getInput.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(mockStatusResult([mockFileStatus('./**/README.md')]))
    } as unknown as jest.Mocked<SimpleGit>

    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(installMod.installHelmDocs).toHaveBeenCalledTimes(1)
    expect(core.getInput).toHaveBeenCalledWith('values-file')
    expect(core.getInput).toHaveBeenCalledWith('chart-search-root')
    expect(core.getInput).toHaveBeenCalledWith('output-file')
    expect(core.getInput).toHaveBeenCalledWith('template-files')
    expect(core.getInput).toHaveBeenCalledWith('sort-values-order')
    expect(core.getBooleanInput).toHaveBeenCalledWith('git-push')
    expect(core.getBooleanInput).toHaveBeenCalledWith('fail-on-diff')
    expect(exec.exec).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenLastCalledWith(
      "'README.md' has changed, but no action was requested."
    )
  })

  it('should not add cached path to PATH when already present', async () => {
    const originalPath = process.env.PATH
    const cachedPath = '/mocked/path/schema'
    const cachedPathDir = '/mocked/path'

    process.env.PATH = `${cachedPathDir}:/usr/bin:/bin`
    installMod.installHelmDocs.mockResolvedValue(cachedPath)

    await run()

    expect(core.addPath).not.toHaveBeenCalled()

    process.env.PATH = originalPath
  })

  it('should handle non-Error instance without setting failed', async () => {
    const nonError = 'This is not an Error instance'

    installMod.installHelmDocs.mockRejectedValue(nonError)

    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
  })
})
