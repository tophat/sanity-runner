module.exports = {
    conventionalChangelogConfig: '@tophat/conventional-changelog-config',
    changelogFilename: 'CHANGELOG.md',
    persistVersions: true,
    autoCommitMessage: 'chore: release sanity runner [skip ci]',

    packageGroupManifestField: 'group',
    registryMode: 'npm',
    packageGroups: {
        'sanity-runner-terraform': {
            registryMode: 'manifest',
        },
    },
}
