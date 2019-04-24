module.exports = {
    'plugins': [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        ["@semantic-release/github", {
            "assets": [
                {"path": "release-archive/*"}
            ]
        }],
        ['semantic-release-docker', {
            "release": {
                "verifyConditions": {
                  "path": "semantic-release-docker",
                  "registryUrl": "docker.io"
                },
                "publish": {
                  "path": "semantic-release-docker",
                  "name": "tophat/sanity-runner"
                }
              }
        }]
    ]
}
