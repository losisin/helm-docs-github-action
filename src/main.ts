import * as path from 'path'
import { installHelmDocs } from './install'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { simpleGit } from 'simple-git'

const version = 'v1.14.2'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const chartSearchRoot = core.getInput('chart-search-root')
    const valuesFile = core.getInput('values-file')
    const outputFile = core.getInput('output-file')
    const templateFiles = core.getInput('template-files')
    const gitPush = core.getInput('git-push')
    const gitPushUserName = core.getInput('git-push-user-name')
    const gitPushUserEmail = core.getInput('git-push-user-email')
    const gitCommitMessage = core.getInput('git-commit-message')
    const failOnDiff = core.getInput('fail-on-diff')

    core.startGroup(`Downloading helm-docs ${version}`)
    const cachedPath = await installHelmDocs(version)
    core.endGroup()

    process.env['PATH']?.startsWith(path.dirname(cachedPath)) ||
      core.addPath(path.dirname(cachedPath))

    core.info(`helm-docs binary '${version}' has been cached at ${cachedPath}`)
    core.setOutput('helm-docs', cachedPath)

    const templateFilesArray = templateFiles.split(',').map(file => file.trim())

    const args = [
      '--values-file',
      valuesFile,
      '--output-file',
      outputFile,
      '--chart-search-root',
      chartSearchRoot
    ]

    for (const templateFile of templateFilesArray) {
      args.push('--template-files')
      args.push(templateFile)
    }

    await exec.exec('helm-docs', args)

    const git = simpleGit()
    const statusSummary = await git.status()

    const outputStatus = statusSummary.files.filter(file =>
      file.path.endsWith(outputFile)
    )

    if (outputStatus.length > 0) {
      switch (true) {
        case failOnDiff === 'true':
          core.setFailed(`'${outputFile}' has changed`)
          break
        case gitPush === 'true':
          await git.addConfig('user.name', gitPushUserName)
          await git.addConfig('user.email', gitPushUserEmail)
          for (const file of outputStatus) {
            await git.add(file.path)
          }
          await git.commit(gitCommitMessage)
          await git.push()
          core.info(`Pushed '${outputFile}' to the branch.`)
          break
        default:
          core.info(`'${outputFile}' has changed, but no action was requested.`)
      }
    } else {
      core.info(`'${outputFile}' is up to date.`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
