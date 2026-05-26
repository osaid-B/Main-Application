import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'backend_backup/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // Context/hook files and utility modules that intentionally co-locate
  // non-component exports alongside components or hooks.
  {
    files: [
      '**/context/**/*.{ts,tsx}',
      '**/contexts/**/*.{ts,tsx}',
      'src/components/ui/Toast.tsx',
      'src/components/ui/Sparkline.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
