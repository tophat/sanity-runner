module.exports = {
    conventionalChangelogConfig: '@tophat/conventional-changelog-config',
    noRegistry: true,
    changelogFilename: '<packageDir>/CHANGELOG.md',
    persistVersions: true,
    autoCommitMessage: 'chore: release sanity runner [skip ci]',
    plugins: ['@monodeploy/plugin-github'],
}
