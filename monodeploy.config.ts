import {
    type MonodeployConfiguration,
    type RecursivePartial,
    RegistryMode,
} from '@monodeploy/types'

const config: RecursivePartial<MonodeployConfiguration> = {
    conventionalChangelogConfig: '@tophat/conventional-changelog-config',
    changelogFilename: 'CHANGELOG.md',
    persistVersions: true,
    autoCommitMessage: 'chore: release sanity runner [skip ci]',

    packageGroupManifestField: 'group',
    registryMode: RegistryMode.NPM,
    packageGroups: {
        'sanity-runner-terraform': {
            registryMode: RegistryMode.Manifest,
        },
    },
}

module.exports = config
