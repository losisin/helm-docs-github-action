import type * as os from 'os'
import { jest } from '@jest/globals'

export const type = jest.fn<typeof os.type>()
export const arch = jest.fn<typeof os.arch>()
