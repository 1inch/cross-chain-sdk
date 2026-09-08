import oneInchEslintConfig from '@1inch/eslint-config'
import oneInchTestingConfig from '@1inch/eslint-config/testing'
import requireExtension from './eslint/require-extension.mjs'

const specNaming = {
    unitTestSuffix: '.spec.ts',
    integrationTestSuffix: '.integration.spec.ts'
}

export default [
    ...oneInchEslintConfig,
    ...oneInchTestingConfig,
    requireExtension.configs.recommended,
    {
        rules: {
            '1inch-testing/require-test-for-class-or-function': [
                'error',
                specNaming
            ],
            '1inch-testing/require-controller-integration-test': [
                'error',
                specNaming
            ],
            '1inch-testing/require-secondary-adapter-integration-test': [
                'error',
                specNaming
            ],
            '1inch-testing/require-use-case-unit-test': ['error', specNaming],
            '1inch-testing/require-cache-integration-test': [
                'error',
                specNaming
            ]
        }
    }
]
