module.exports = {
    'verifyConditions': {
        'path': 'semantic-release-docker',
        'registryUrl': 'ghcr.io'
    },
    'publish': {
        'path': 'semantic-release-docker',
        'name': 'ghcr.io/tophat/sanity-runner-client'
    },
    'plugins': [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        ['@semantic-release/github', {
            'assets': [
                { 'path': './release-archive/*'},
                { 'path': './release-archive/sanity-runner-linux' },
                { 'path': './release-archive/sanity-runner-macos' },
                { 'path': './release-archive/sanity-runner-win.exe' }
            ]
        }],
        ['semantic-release-docker', {
            'name': 'ghcr.io/tophat/sanity-runner-client'
        }]
    ]
}
