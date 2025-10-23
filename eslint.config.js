import vitest from '@vitest/eslint-plugin'
import importX from 'eslint-plugin-import-x'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactNative from 'eslint-plugin-react-native'
import { defineConfig } from 'eslint/config'
import { builtinModules } from 'node:module'
import tseslint from 'typescript-eslint'

const DOMGlobals = ['window', 'document', 'navigator', 'location']
const NodeGlobals = ['module', 'require', 'process', 'Buffer']
const ElectronGlobals = ['electron', 'ipcRenderer', 'ipcMain']
const ReactNativeGlobals = ['__DEV__', 'alert', 'fetch']

const banConstEnum = {
  selector: 'TSEnumDeclaration[const=true]',
  message:
    'Please use non-const enums. This project automatically inlines enums.',
}

export default defineConfig([
  // ==================== 基础配置 ====================
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.base],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'import-x': importX,
    },
    rules: {
      // 基础规则
      'no-debugger': 'error',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-unused-vars': 'off', // 由 TypeScript 处理
      'no-undef': 'off', // 由 TypeScript 处理

      // 环境限制
      'no-restricted-globals': ['error', ...DOMGlobals, ...NodeGlobals],

      // 语法限制
      'no-restricted-syntax': [
        'error',
        banConstEnum,
        {
          selector: 'ObjectPattern > RestElement',
          message:
            'Object rest spread results in verbose helpers. Use extend helper instead.',
        },
        {
          selector: 'ObjectExpression > SpreadElement',
          message:
            'Object spread results in verbose helpers. Use extend helper instead.',
        },
        {
          selector: 'AwaitExpression',
          message: 'Async/await syntax should be avoided for ES2016 target.',
        },
        {
          selector: 'ChainExpression',
          message: 'Optional chaining results in verbose helpers.',
        },
      ],

      // 导入规则
      'sort-imports': ['error', { ignoreDeclarationSort: true }],
      'import-x/no-nodejs-modules': [
        'error',
        { allow: builtinModules.map(mod => `node:${mod}`) },
      ],
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
        },
      ],

      // TypeScript 规则
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
    },
  },

  // ==================== 共享包配置 ====================
  {
    files: ['packages/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': 'off', // 共享包可能在任何环境使用
      'no-restricted-syntax': [
        'error',
        banConstEnum,
        // 共享包允许更多语法
      ],
    },
  },

  // ==================== Web 端配置 ====================
  {
    files: ['packages/web/**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...DOMGlobals.reduce(
          (acc, global) => ({ ...acc, [global]: 'readonly' }),
          {},
        ),
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'no-restricted-globals': 'off', // Web 环境允许 DOM globals
      'react/react-in-jsx-scope': 'off', // React 17+ 不需要导入 React
      'react/prop-types': 'off', // 使用 TypeScript
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
    },
  },

  // ==================== 移动端配置 ====================
  {
    files: ['packages/mobile/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-native': reactNative,
    },
    rules: {
      // 覆盖 expo 的默认规则
      'no-restricted-globals': 'off', // React Native 环境
      'no-console': ['warn', { allow: ['warn', 'error'] }], // 覆盖 expo 的 console 规则

      // React Native 特定规则
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'error',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-raw-text': 'warn',

      // 保持项目一致的规则
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
    },
  },

  // ==================== 桌面端配置 ====================
  {
    files: ['packages/desktop/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...NodeGlobals.reduce(
          (acc, global) => ({ ...acc, [global]: 'readonly' }),
          {},
        ),
        ...ElectronGlobals.reduce(
          (acc, global) => ({ ...acc, [global]: 'readonly' }),
          {},
        ),
      },
    },
    rules: {
      'no-restricted-globals': 'off', // Electron 环境
      'import-x/no-nodejs-modules': 'off', // Electron 可以使用 Node.js 模块
    },
  },

  // ==================== 小程序端配置 ====================
  {
    files: ['packages/mini/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-restricted-globals': 'off', // 小程序环境
      'no-restricted-syntax': [
        'error',
        banConstEnum,
        // 小程序环境允许更多语法
      ],
    },
  },

  // ==================== 测试文件配置 ====================
  {
    files: [
      '**/__tests__/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'test.spec.ts',
    ],
    plugins: { vitest },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...vitest.environments.env.globals,
      },
    },
    rules: {
      'no-console': 'off',
      'no-restricted-globals': 'off',
      'no-restricted-syntax': 'off',
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-have-length': 'error',
    },
  },

  // ==================== 配置文件 ====================
  {
    files: [
      'eslint.config.js',
      'vite.config.{js,ts}',
      'vitest.config.{js,ts}',
      'rollup*.config.js',
      'metro.config.js',
      'babel.config.js',
      'jest.config.js',
      'scripts/**',
      './*.{js,ts}',
      'packages/*/*.js',
      'packages/*/config/**',
    ],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-syntax': ['error', banConstEnum],
      'no-console': 'off',
      'import-x/no-nodejs-modules': 'off',
    },
  },

  // ==================== 忽略文件 ====================
  {
    ignores: [
      '**/dist/',
      '**/temp/',
      '**/coverage/',
      '**/node_modules/',
      '**/.git/',
      '**/.idea/',
      '**/playground/',
      '**/build/',
      '**/out/',
      '**/.next/',
      '**/.nuxt/',
      '**/.output/',
      '**/.vite/',
      '**/android/',
      '**/ios/',
      '**/.expo/',
      '**/expo-env.d.ts',
      '**/metro.config.js',
      '**/babel.config.js',
      '**/jest.config.js',
      '**/tailwind.config.js',
      '**/postcss.config.js',
      '**/webpack.config.js',
      '**/rollup.config.js',
      '**/vite.config.js',
      '**/vitest.config.js',
      '**/eslint.config.js',
      '**/prettier.config.js',
      '**/stylelint.config.js',
      '**/commitlint.config.js',
      '**/husky.config.js',
      '**/lint-staged.config.js',
      '**/renovate.config.js',
      '**/dependabot.yml',
      '**/.github/',
      '**/.vscode/',
      '**/.idea/',
      '**/explorations/',
      '**/dts-build/',
      '**/packages-private/',
    ],
  },
])
