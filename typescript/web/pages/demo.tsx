import * as React from 'react';
import DefaultHeader from '../components/DefaultHeader';
import Layout from '../components/Layout';
import LoadPreTrainedExample from '../components/LoadPreTrainedExample';

export default ({ location }: any) => {
    return (
        <Layout location={location} addPadding>
            <DefaultHeader />
            <LoadPreTrainedExample />
        </Layout>
    );
};
