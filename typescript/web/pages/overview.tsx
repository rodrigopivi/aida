import { graphql } from 'gatsby';
import Link from 'gatsby-link';
import * as React from 'react';
import Helmet from 'react-helmet';
import Layout from '../components/Layout';

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
            <h1>Create delightful conversational user experiences!</h1>
            <p>
                Aida is a natural language understanding pipeline implemented in TensorflowJS and Keras that can run in browsers, nodejs,
                python or export to mobile devices (keras models can be exported to CoreML for iOS and to Tensorflow Android).
            </p>
            The project is a minimalistic implementation because the trained models should be able to run in browsers. This slim model is
            thanks to fastText n-grams (our embedding layer only uses 3 letter n-grams or less to construct words). This are the main
            components included:
            <ul>
                <li>Easily generate your dataset from cratch using Chatito DSL</li>
                <li>Pre-trained fastText n-grams embeddings for english (more languages soon)</li>
                <li>
                    A Python implementation on top of Keras (trained models can train and predict in python and be exported to js or mobile
                    environments)
                </li>
                <li>A Typescript implementation on top of TensorflowJS (models that can train and predict in the browser and nodejs)</li>
                <li>Documentation + examples</li>
            </ul>
            <p>
                <Link to="/example" href="/example">
                    Try the pre-trained examples
                </Link>
            </p>
        </Layout>
    );
};

export const query = graphql`
    query AboutQuery {
        site {
            siteMetadata {
                title
            }
        }
    }
`;
