import { graphql } from 'gatsby';
import * as React from 'react';
import Helmet from 'react-helmet';
import LandingFooter from '../components/Landing/LandingFooter';
import LandingHeader from '../components/Landing/LandingHeader';
import LandingMain from '../components/Landing/LandingMain';
import LandingSecondary from '../components/Landing/LandingSecondary';

export default ({ data }: any) => {
    return [
        <LandingHeader key="header" />,
        <LandingMain key="main" />,
        <LandingSecondary key="secondary" />,
        <LandingFooter key="footer" />,
        <Helmet
            key="helmet"
            title={data.site.siteMetadata.title}
            meta={[
                { name: 'description', content: data.site.siteMetadata.title },
                {
                    content:
                        'aida, chatito, chatbots, ai, nlu, nlp, natural language processing, tensorflowjs, keras, named entity recognition, text classification',
                    name: 'keywords'
                }
            ]}
        />
    ];
};

export const query = graphql`
    query IndexQuery {
        site {
            siteMetadata {
                title
            }
        }
    }
`;
