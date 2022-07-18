module.exports = {
    conventionalChangelogConfig: '@tophat/conventional-changelog-config',
    changelogFilename: '<packageDir>/CHANGELOG.md',
    persistVersions: true,
    autoCommitMessage: 'chore: release sanity runner [skip ci]',

    registryMode: 'npm',
    packageGroups: {
        'sanity-runner-terraform': {
            registryMode: 'manifest',
        },
    },
}
