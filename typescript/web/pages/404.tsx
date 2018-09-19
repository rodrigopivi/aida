import * as React from 'react';
import DefaultHeader from '../components/DefaultHeader';
import Layout from '../components/Layout';
import Link from 'gatsby-link';

export default ({ location }: any) => {
    return (
        <Layout location={location} style={{ minHeight: '95vh' }}>
            <DefaultHeader />
            <div>
            <h1>404: Page not found.</h1>
                <p>
                    You've hit the void. <Link to="/">Go back.</Link>
                </p>
            </div>
        </Layout>
    );
};
