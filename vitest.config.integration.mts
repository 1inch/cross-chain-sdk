import {defineConfig} from 'vitest/config'
import base from './vitest.config.mjs'

export default defineConfig({
    ...base,
    test: {
        globals: true,
        root: './',
        include: ['tests/**/*.spec.ts'],
        environment: 'node',
        testTimeout: 600_000,
        hookTimeout: 600_000
    }
})
