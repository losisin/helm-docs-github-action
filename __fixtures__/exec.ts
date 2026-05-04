import type * as ExecModule from '@actions/exec'
import { jest } from '@jest/globals'

export const exec = jest.fn<typeof ExecModule.exec>()
