import swc from 'unplugin-swc'
import {defineConfig} from 'vitest/config'

const config = defineConfig({
    test: {
        globals: true,
        environment: 'node',
        root: './',
        include: ['./src/**/*.spec.ts'],
        exclude: ['./src/**/*integration.spec.ts', './src/**/*e2e.spec.ts'],
        testTimeout: 30_000,
        hookTimeout: 30_000,
        clearMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['json-summary', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                '**/*.spec.ts',
                '**/*.test.ts',
                '**/test-utils/**',
                'src/index.ts',
                'dist'
            ]
        },
        server: {
            deps: {
                inline: [/@1inch\/.*/, 'axios']
            }
        }
    },
    resolve: {
        alias: [{find: /^(\.{1,2}\/.*)\.js$/, replacement: '$1'}]
    },
    plugins: [
        swc.vite({
            tsconfigFile: false,
            jsc: {
                parser: {syntax: 'typescript', decorators: true},
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true
                },
                keepClassNames: true
            }
        }),
        {
            name: 'do-not-log-about-bad-sourcemaps',
            config(viteConfig): void {
                const oldWarn = viteConfig.customLogger?.warnOnce

                if (viteConfig.customLogger?.warnOnce) {
                    viteConfig.customLogger.warnOnce = (msg, options): void => {
                        if (msg.endsWith('points to missing source files')) {
                            return
                        }

                        oldWarn?.(msg, options)
                    }
                }
            }
        }
    ]
})

export default config
