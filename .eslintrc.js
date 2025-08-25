/**
 * ESLint Configuration for PayPass Platform
 * Comprehensive linting rules for code quality and security
 */

module.exports = {
  root: true,
  
  // Parser configuration
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },

  // Environment settings
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
  },

  // Extends configurations
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:security/recommended',
    'next/core-web-vitals',
  ],

  // Plugins
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'security',
  ],

  // Rule configurations
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],
    '@typescript-eslint/no-unsafe-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    
    // General JavaScript rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    
    // React specific rules
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed in Next.js
    'react/display-name': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-bind': ['error', { 
      allowArrowFunctions: true,
      allowFunctions: false,
      allowBind: false 
    }],
    'react/jsx-no-leaked-render': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-unstable-nested-components': 'error',
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Import/Export rules
    'no-duplicate-imports': 'error',
    'sort-imports': ['error', {
      ignoreCase: true,
      ignoreDeclarationSort: true,
    }],
    
    // Formatting rules (should match Prettier config)
    'indent': 'off', // Handled by Prettier
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Performance rules
    'react/jsx-no-constructed-context-values': 'error',
    'react/jsx-no-target-blank': ['error', { 
      allowReferrer: false,
      enforceDynamicLinks: 'always',
    }],
  },

  // Rule overrides for specific file patterns
  overrides: [
    // Test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-unsafe-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'security/detect-object-injection': 'off',
        'no-console': 'off',
      },
    },
    
    // Configuration files
    {
      files: ['*.config.js', '*.config.ts', '.eslintrc.js'],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      },
    },
    
    // API routes
    {
      files: ['app/api/**/*.ts', 'pages/api/**/*.ts'],
      rules: {
        'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      },
    },
    
    // Scripts
    {
      files: ['scripts/**/*.js', 'scripts/**/*.ts'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],

  // Settings
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },

  // Ignore patterns
  ignorePatterns: [
    '.next',
    'node_modules',
    'dist',
    'build',
    '*.generated.ts',
    'coverage',
    'test-results',
  ],
};