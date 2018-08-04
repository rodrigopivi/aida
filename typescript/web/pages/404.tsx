import Link from 'gatsby-link';
import * as React from 'react';
import Layout from '../components/Layout';

const NotFoundPage = ({ location }: any) => (
    <Layout location={location}>
        <h1>404: Page not found.</h1>
        <p>
            You've hit the void.{' '}
            <Link to="/" href="/">
                Go back.
            </Link>
        </p>
    </Layout>
);

export default NotFoundPage;
