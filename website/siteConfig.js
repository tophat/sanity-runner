const siteConfig = {
    title: 'Sanity Runner',
    tagline: 'Sanity Runner',
    // For deploy
    cname: 'sanity-runner.js.org',
    url: 'https://sanity-runner.js.org',
    baseUrl: '/',
    projectName: 'sanity-runner',
    organizationName: 'tophat',
    // End deploy options
    headerLinks: [
        { doc: 'overview', label: 'Docs' },
        { href: "https://github.com/tophat/sanity-runner", label: "GitHub" },
    ],
    headerIcon: 'img/runner.png',
    footerIcon: 'img/runner.png',
    favicon: 'img/favicon.png',
    colors: {
        primaryColor: '#ff8926',
        secondaryColor: '#ff8926',
    },
    customDocsPath: 'docs',
    gaTrackingId: 'UA-129741728-1',

    copyright: 'Top Hat Open Source',

    highlight: {
        // Highlight.js theme to use for syntax highlighting in code blocks.
        theme: 'default',
    },

    // Add custom scripts here that would be placed in <script> tags.
    scripts: ['https://buttons.github.io/buttons.js'],
    onPageNav: 'separate', // On page navigation for the current documentation page.
    cleanUrl: true, // No .html extensions for paths.

    // Open Graph and Twitter card images.
    ogImage: 'img/runner.png',
    twitterImage: 'img/runner.png',

    // Show documentation's last contributor's name.
    enableUpdateBy: true,
}

module.exports = siteConfig
