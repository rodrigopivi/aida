import { graphql } from 'gatsby';
import * as React from 'react';
import Helmet from 'react-helmet';
import Layout from '../components/Layout';
import LoadPreTrainedExample from '../components/LoadPreTrainedExample';

export default ({ data, location }: any) => {
    return (
        <Layout location={location} style={{ minHeight: '95vh' }}>
            <Helmet
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
            <LoadPreTrainedExample />
        </Layout>
    );
};

export const query = graphql`
    query ExampleQuery {
        site {
            siteMetadata {
                title
            }
        }
    }
`;
