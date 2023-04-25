/**
 * Builds bundle and docker image.
 */

import path from 'path'

import { type Plugin, build } from 'esbuild'
import { glob } from 'glob'

const serviceDir = path.resolve(__dirname)

async function findFiles(pattern: string, cwd: string): Promise<Array<string>> {
    return glob(pattern, { cwd }).then((matches) => matches.map((name) => path.relative(cwd, name)))
}

const ExternalPlugin: Plugin = {
    name: 'external-packages',
    setup(build) {
        const filter = /^[^./]|^\.[^./]|^\.\.[^/]/
        build.onResolve({ filter }, (args) => {
            const isSanityRunnerWorkspace = args.path.includes('@tophat/sanity-runner-')
            if (isSanityRunnerWorkspace) {
                return {
                    path: require.resolve(args.path, { paths: [args.resolveDir] }),
                    external: false,
                }
            }
            return {
                path: args.path,
                external: true,
            }
        })
    },
}

async function buildWithOutput(...params: Parameters<typeof build>): Promise<void> {
    const result = await build(...params)
    if (result.warnings.length) {
        console.warn(result.warnings)
    }
    if (result.errors.length) {
        console.error(result.errors)
    }
}

async function main() {
    // Build testHooks
    console.log('Building Test Hooks...')
    await buildWithOutput({
        entryPoints: await findFiles('src/core/runners/testHooks/*', serviceDir),
        platform: 'node',
        target: 'node16',
        outdir: path.resolve(serviceDir, 'bundle', 'testHooks'),
        bundle: true,
        plugins: [ExternalPlugin],
        absWorkingDir: serviceDir,
    })

    // Build handler
    console.log('Building handler...')
    await buildWithOutput({
        entryPoints: ['src/handler.ts'],
        platform: 'node',
        target: 'node16',
        outdir: path.resolve(serviceDir, 'bundle'),
        bundle: true,
        plugins: [ExternalPlugin],
        absWorkingDir: serviceDir,
        external: (
            await findFiles('src/core/runners/testHooks/*', serviceDir)
        ).map(
            (name) =>
                `./${path.relative('src/core/runners', name.substring(0, name.lastIndexOf('.')))}`,
        ),
    })

    console.log('Build complete.')
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
