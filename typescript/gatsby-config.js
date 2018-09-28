module.exports = {
    siteMetadata: {
        title: 'Aida'
    },
    plugins: [
        'gatsby-plugin-sharp',
        {
            resolve: 'gatsby-plugin-page-creator',
            options: {
                path: `${__dirname}/web/pages`
            }
        },
        {
            resolve: `gatsby-source-filesystem`,
            options: {
                path: `${__dirname}/../`,
                ignore: ['!(readme.md|docs/*|typescript/examples/*.chatito)'],
                name: "markdown-pages",
            },
        },
        {
            resolve: `gatsby-transformer-remark`,
            options: {
              plugins: [
                "gatsby-remark-copy-linked-files",
                {
                  resolve: `gatsby-remark-images`,
                        options: {
                            // It's important to specify the maxWidth (in pixels) of
                            // the content container as this plugin uses this as the
                            // base for generating different widths of each image.
                            maxWidth: 590,
                        },
                    },
                ],
            },
        },
        'read-chatito-files',
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-typescript',
        'gatsby-plugin-styled-components'
    ]
};
