import * as React from 'react';
import DefaultHeader from '../components/DefaultHeader';
import Layout from '../components/Layout';
import { graphql } from 'gatsby';

export default ({ location, data }: any) => {
    return (
        <Layout location={location} addPadding>
            <DefaultHeader />
            <div dangerouslySetInnerHTML={{ __html: data.allFile.edges[0].node.childMarkdownRemark.html }} />
        </Layout>
    );
};

export const query = graphql`
    query ReadmeMarkdownFile {
        allFile(filter: { name: { eq: "readme" }, extension: { eq: "md" }, sourceInstanceName: { eq: "markdown-pages" } }) {
            edges {
                node {
                    childMarkdownRemark {
                        html
                    }
                }
            }
        }
    }
`;
