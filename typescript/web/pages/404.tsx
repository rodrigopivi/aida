import Link from 'gatsby-link';
import * as React from 'react';
import DefaultHeader from '../components/DefaultHeader';
import Layout from '../components/Layout';

const NotFoundPage = ({ location }: any) => (
    <Layout location={location} style={{ minHeight: '95vh' }}>
        <DefaultHeader />
        <h1>404: Page not found.</h1>
        <p>
            You've hit the void. <Link to="/">Go back.</Link>
        </p>
    </Layout>
);

export default NotFoundPage;
