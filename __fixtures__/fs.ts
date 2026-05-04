import type * as fs from 'fs'
import { jest } from '@jest/globals'

export const chmodSync = jest.fn<typeof fs.chmodSync>()
/** install.ts calls `readdirSync(path)` with one argument → `string[]` */
export const readdirSync = jest.fn<(path: fs.PathLike) => string[]>()
export const statSync = jest.fn<typeof fs.statSync>()
