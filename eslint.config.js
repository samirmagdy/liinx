import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  // Ignored patterns
  {
    ignores: [
      'dist/**',
      'dist-server/**',
      'node_modules/**',
      'coverage/**',
      'data/**',
      'public/uploads/**',
      '*.log'
    ]
  },

  // Base recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Global settings and language options for TypeScript and JavaScript
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2022
      }
    },
    rules: {
      // Unused variables & imports (allow _ prefix, caught errors allowed)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none'
        }
      ],

      // Type imports consistency
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false
        }
      ],

      // Disallow any explicit unsafe patterns / empty functions without reason
      '@typescript-eslint/no-explicit-any': 'off', // allow any where SQLite / dynamic types are needed, but keep clean
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-unreachable': 'error',
      'no-duplicate-imports': 'error',
      'no-control-regex': 'off'
    }
  },

  // Architectural guardrails are warnings here so the existing baseline can
  // be reviewed without forcing meaningless splits. CI runs the baseline-aware
  // architecture check, which blocks new or worsening violations.
  {
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
    ignores: ['src/config/**', 'src/demo/**', 'server/db.ts'],
    rules: {
      'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true, IIFEs: true }],
      complexity: ['warn', { max: 25 }],
      'max-depth': ['warn', 4]
    }
  },

  // React & React Hooks specific rules for frontend files
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: '19.0'
      }
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-key': 'error',
      'react/no-unescaped-entities': 'off',
      'react/react-in-jsx-scope': 'off' // Not needed in React 19 JSX transform
    }
  },

  // Test files rules (relax some restrictions for mocks & fixtures)
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
