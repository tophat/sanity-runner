module.exports = {
    pathPrefix: '/sanity-runner',
    assetPrefix: 'https://tophat.github.io',
    siteMetadata: {
        title: 'Sanity Runner',
        description: 'Distributed end to end test runner.',
        author: 'Top Hat',
    },
    plugins: [
        'gatsby-plugin-react-helmet',
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'images',
                path: `${__dirname}/src/images/`,
            },
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'pages',
                path: `${__dirname}/src/pages/`,
            },
        },
        {
            resolve: 'gatsby-plugin-mdx',
            options: {
                gatsbyRemarkPlugins: [
                    {
                        resolve: require.resolve('gatsby-remark-autolink-headers'),
                    },
                    {
                        resolve: require.resolve('gatsby-remark-images'),
                        options: { maxWidth: 1000, linkImagesToOriginal: false },
                    },
                ],
            },
        },
        'gatsby-plugin-sharp',
        'gatsby-transformer-sharp',
        'gatsby-plugin-image',
        {
            resolve: 'gatsby-plugin-manifest',
            options: {
                name: 'gatsby-starter-default',
                short_name: 'starter',
                start_url: '/',
                background_color: '#803ed7',
                theme_color: '#803ed7',
                display: 'minimal-ui',
                icon: 'src/images/logo.png', // This path is relative to the root of the site.
            },
        },
        'gatsby-plugin-gatsby-cloud',
    ],
}
