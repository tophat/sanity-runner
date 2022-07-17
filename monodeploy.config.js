module.exports = {
    conventionalChangelogConfig: '@tophat/conventional-changelog-config',
    changelogFilename: '<packageDir>/CHANGELOG.md',
    persistVersions: true,
    autoCommitMessage: 'chore: release sanity runner [skip ci]',

    registryMode: 'npm',
    packageGroups: {
        'sanity-runner-service': {
            registryMode: 'manifest',
        },
        'sanity-runner-terraform': {
            registryMode: 'manifest',
        },
    },
}
