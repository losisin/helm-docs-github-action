import { jest } from '@jest/globals'

export const installHelmDocs = jest.fn<(version: string) => Promise<string>>()
