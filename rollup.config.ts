// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

/**
 * @actions/* ships transpiled helpers like `(this && this.__awaiter)`; when
 * Rollup bundles them into ESM, `this` becomes undefined by spec but the
 * expression still short-circuits to the correct fallback. Circular imports
 * between core and oidc-utils are a known toolkit layout. We only silence
 * these for node_modules so our own code still surfaces warnings.
 *
 * @type {import('rollup').WarningHandlerWithDefault}
 */
const onwarn = (warning, defaultHandler) => {
  if (
    warning.code === 'THIS_IS_UNDEFINED' &&
    warning.id?.includes('node_modules')
  ) {
    return
  }
  if (
    warning.code === 'CIRCULAR_DEPENDENCY' &&
    warning.ids?.some((id) => id.includes('node_modules'))
  ) {
    return
  }
  defaultHandler(warning)
}

const config = {
  input: 'src/index.ts',
  onwarn,
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        module: 'ESNext',
        moduleResolution: 'Bundler'
      }
    }),
    nodeResolve({ preferBuiltins: true }),
    commonjs()
  ]
}

export default config
