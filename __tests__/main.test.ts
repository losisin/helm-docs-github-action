/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */
import { run } from '../src/main'

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { simpleGit, SimpleGit } from 'simple-git'
import { installHelmDocs } from '../src/install'

jest.mock('@actions/core')
jest.mock('@actions/exec')
jest.mock('simple-git')
jest.mock('../src/install')

describe('run function', () => {
  let getInputMock: jest.SpyInstance
  let setFailedMock: jest.SpyInstance
  let execMock: jest.SpyInstance
  let simpleGitMock: jest.MockedFunction<typeof simpleGit>
  let installHelmDocsMock: jest.MockedFunction<typeof installHelmDocs>
  let setOutputMock: jest.SpyInstance
  let infoMock: jest.SpyInstance

  beforeEach(() => {
    jest.restoreAllMocks()

    getInputMock = jest.spyOn(core, 'getInput')
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    infoMock = jest.spyOn(core, 'info').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed')
    execMock = jest.spyOn(exec, 'exec').mockImplementation()
    simpleGitMock = simpleGit as unknown as jest.MockedFunction<
      typeof simpleGit
    >
    installHelmDocsMock = installHelmDocs as unknown as jest.MockedFunction<
      typeof installHelmDocs
    >

    process.env['PATH'] = '/usr/local/bin'
    process.env['GITHUB_WORKSPACE'] = '/github/workspace'
  })

  it('should handle success scenario', async () => {
    installHelmDocsMock.mockResolvedValue('/mocked/path')
    getInputMock.mockReturnValue('false')
    const gitMock: jest.Mocked<SimpleGit> = {
      status: jest.fn().mockResolvedValue({ files: [] })
    } as any
    simpleGitMock.mockReturnValue(gitMock)

    await run()

    expect(installHelmDocsMock).toHaveBeenCalledTimes(1)
    expect(getInputMock).toHaveBeenCalledWith('values-file')
    expect(getInputMock).toHaveBeenCalledWith('chart-search-root')
    expect(getInputMock).toHaveBeenCalledWith('output-file')
    expect(getInputMock).toHaveBeenCalledWith('fail-on-diff')
    expect(execMock).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)
  })

  it("should handle fail-on-diff === 'true'", async () => {
    installHelmDocsMock.mockResolvedValue('/mocked/path')
    getInputMock.mockImplementation((inputName: string) => {
      if (inputName === 'fail-on-diff') {
        return 'true'
      }
      return 'a-random-string'
    })

    const gitMock: jest.Mocked<SimpleGit> = {
      status: jest.fn().mockResolvedValue({
        files: [{ path: 'a-random-string' }]
      })
    } as any

    simpleGitMock.mockReturnValue(gitMock)

    await run()

    expect(installHelmDocsMock).toHaveBeenCalledTimes(1)
    expect(getInputMock).toHaveBeenCalledWith('values-file')
    expect(getInputMock).toHaveBeenCalledWith('chart-search-root')
    expect(getInputMock).toHaveBeenCalledWith('output-file')
    expect(getInputMock).toHaveBeenCalledWith('fail-on-diff')
    expect(execMock).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)

    expect(setFailedMock).toHaveBeenCalledWith("'a-random-string' has changed")
  })

  it("should handle git-push === 'true'", async () => {
    installHelmDocsMock.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      'git-push': 'true',
      'git-push-user-name': 'username',
      'git-push-user-email': 'user@email.com',
      'git-commit-message': 'message',
      'output-file': 'output-file',
      'values-file': 'values-file',
      'chart-search-root': 'chart-search-root'
    }

    getInputMock.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })

    const gitMock: jest.Mocked<SimpleGit> = {
      status: jest.fn().mockResolvedValue({
        files: [{ path: 'output-file' }]
      }),
      addConfig: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      push: jest.fn().mockResolvedValue(undefined)
    } as any

    simpleGitMock.mockReturnValue(gitMock)

    await run()

    expect(installHelmDocsMock).toHaveBeenCalledWith('v1.11.3')
    expect(getInputMock).toHaveBeenCalledWith('values-file')
    expect(getInputMock).toHaveBeenCalledWith('chart-search-root')
    expect(getInputMock).toHaveBeenCalledWith('output-file')
    expect(getInputMock).toHaveBeenCalledWith('git-push')
    expect(getInputMock).toHaveBeenCalledWith('git-push-user-name')
    expect(getInputMock).toHaveBeenCalledWith('git-push-user-email')
    expect(getInputMock).toHaveBeenCalledWith('git-commit-message')
    expect(execMock).toHaveBeenCalledTimes(1)
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
    expect(gitMock.add).toHaveBeenCalledWith(['output-file'])
    expect(gitMock.commit).toHaveBeenCalledWith('message')
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(setOutputMock).toHaveBeenCalledWith('helm-docs', '/mocked/path')
    expect(infoMock).toHaveBeenLastCalledWith(
      "Pushed 'output-file' to the branch."
    )
  })

  it('sets failure if an error is thrown', async () => {
    const errorMessage = 'Something went wrong'

    jest.spyOn(exec, 'exec').mockImplementation(() => {
      throw new Error(errorMessage)
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(errorMessage)
  })
})
