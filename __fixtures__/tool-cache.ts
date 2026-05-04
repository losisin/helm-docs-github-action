import type * as tc from '@actions/tool-cache'
import { jest } from '@jest/globals'

export const downloadTool = jest.fn<typeof tc.downloadTool>()
export const find = jest.fn<typeof tc.find>()
export const extractTar = jest.fn<typeof tc.extractTar>()
export const cacheDir = jest.fn<typeof tc.cacheDir>()
