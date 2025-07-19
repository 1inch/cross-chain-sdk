import camelCase from 'camelcase'

import {execSync} from 'child_process'
import path from 'node:path'
import fs from 'fs'

function main(): void {
    const root = path.join(__dirname, '..')
    const contractDir = path.join(
        __dirname,
        '../contracts/lib/solana-crosschain-protocol'
    )

    execSync('yarn && yarn build', {
        cwd: contractDir,
        stdio: 'inherit'
    })

    const idlsFolder = path.join(contractDir, 'target/idl')
    const dstFolder = path.join(root, './src/idl/')
    const idls = fs.readdirSync(idlsFolder)

    for (const idl of idls) {
        const json = JSON.parse(
            fs.readFileSync(path.join(idlsFolder, idl), 'utf-8')
        )
        const fileName = idl.replace(/_/g, '-').replace('.json', '.ts')

        const dstFile = path.join(dstFolder, fileName)

        fs.writeFileSync(
            dstFile,
            [
                `import {WritableDeep} from 'type-fest'`,
                `const _IDL = ${JSON.stringify(convertIdlToCamelCase(json))} as const`,
                `export const IDL: WritableDeep<typeof _IDL> = _IDL as WritableDeep<typeof _IDL>`
            ].join('\n')
        )
    }
}

main()

/**
 * Copy from https://github.com/coral-xyz/anchor/blob/b26f7eb4855af19d0792c3c221d0650e75d929bc/ts/packages/anchor/src/idl.ts#L319
 */
function convertIdlToCamelCase(idl: any): Record<string, unknown> {
    const KEYS_TO_CONVERT = ['name', 'path', 'account', 'relations', 'generic']

    // `my_account.field` is getting converted to `myAccountField` but we
    // need `myAccount.field`.
    const toCamelCase = (s: string): string =>
        s
            .split('.')
            .map((arr) => camelCase(arr))
            .join('.')

    const recursivelyConvertNamesToCamelCase = (
        obj: Record<string, string | string[]>
    ): void => {
        for (const key in obj) {
            const val = obj[key]

            if (KEYS_TO_CONVERT.includes(key)) {
                obj[key] = Array.isArray(val)
                    ? val.map(toCamelCase)
                    : toCamelCase(val)
            } else if (typeof val === 'object') {
                recursivelyConvertNamesToCamelCase(val as any)
            }
        }
    }

    const camelCasedIdl = structuredClone(idl)
    recursivelyConvertNamesToCamelCase(camelCasedIdl as any)

    return camelCasedIdl
}
