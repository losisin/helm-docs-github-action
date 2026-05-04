/**
 * Unit tests for the action's entrypoint, src/index.ts
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'

describe('index.ts', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('calls run when imported', async () => {
    const main = {
      run: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    }
    jest.unstable_mockModule('../src/main.js', () => main)
    await import('../src/index.js')
    expect(main.run).toHaveBeenCalled()
  })
})
