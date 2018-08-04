module.exports = {
    siteMetadata: {
        title: 'Aida'
    },
    pathPrefix: "/aida",
    plugins: [
        {
            resolve: 'gatsby-plugin-page-creator',
            options: {
                path: `${__dirname}/web/pages`
            }
        },
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-typescript',
        'gatsby-plugin-styled-components'
    ]
};
