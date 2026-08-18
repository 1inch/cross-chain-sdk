import swc from 'unplugin-swc'
import {defineConfig} from 'vitest/config'

const config = defineConfig({
    test: {
        globals: true,
        environment: 'node',
        root: './',
        include: ['./src/**/*.spec.ts'],
        testTimeout: 30_000,
        clearMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['json-summary', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: ['src/index.ts', 'dist']
        }
    },
    resolve: {
        // Mirrors Jest's moduleNameMapper: strip the ESM '.js' extension from
        // relative imports only, so bare specifiers like 'bn.js' stay intact
        alias: [{find: /^(\.{1,2}\/.*)\.js$/, replacement: '$1'}]
    },
    server: {
        deps: {
            inline: [/@1inch\/.*/]
        }
    },
    plugins: [
        swc.vite({
            tsconfigFile: false,
            jsc: {
                parser: {syntax: 'typescript', decorators: true},
                transform: {decoratorMetadata: true}
            }
        }),
        {
            name: 'do-not-log-about-bad-sourcemaps',
            config(config, _env): void {
                const oldWarn = config.customLogger?.warnOnce

                if (config.customLogger?.warnOnce) {
                    config.customLogger.warnOnce = (msg, options): void => {
                        if (msg.endsWith('points to missing source files')) return

                        oldWarn?.(msg, options)
                    }
                }
            }
        }
    ]
})

export default config
