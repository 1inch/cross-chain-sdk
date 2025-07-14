import {execSync} from 'child_process'
import path from 'node:path'

const contractPath = 'contracts/lib/solana-crosschain-protocol'

function main(): void {
    const root = path.join(__dirname, '..')
    const contractDir = path.join(__dirname, `../${contractPath}`)

    execSync('yarn && yarn build', {
        cwd: contractDir,
        stdio: 'inherit'
    })

    execSync(`cp ./${contractPath}/target/deploy/*.so ./tests/fixtures`, {
        cwd: root,
        stdio: 'inherit'
    })
}

main()
