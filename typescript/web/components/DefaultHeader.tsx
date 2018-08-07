import * as React from 'react';
import Helmet from 'react-helmet';

export default function DefaultHeader() {
    return (
        <Helmet
            key="helmet"
            title="Aida"
            meta={[
                { name: 'description', content: 'Build amazing conversational experiences' },
                {
                    content:
                        'aida, chatito, chatbots, ai chatbots, nlu, nlp, natural language processing, tensorflowjs, keras, named entity recognition, text classification',
                    name: 'keywords'
                }
            ]}
        >
            <link rel="shortcut icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
            <link rel="manifest" href="/site.webmanifest" />
            <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
            <meta name="msapplication-TileColor" content="#da532c" />
            <meta name="theme-color" content="#fcfcfc" />
        </Helmet>
    );
}
