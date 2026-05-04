import type { SimpleGit } from 'simple-git'
import { jest } from '@jest/globals'

export const simpleGit = jest.fn<() => SimpleGit>()
