import { graphql } from 'gatsby';
import * as React from 'react';
import Editor from '../components/Editor/Editor';
import Layout from '../components/Layout';
import TrainingDashboard, { ITrainingDashboardProps } from '../components/TrainingDashboard';
import { IEditorTabs } from '../components/Editor/editorConfig';

export default class AidaTrain extends React.Component<any, {}> {
    public render() {
        const { data, location } = this.props;
        let chatitoFiles: IEditorTabs[] = [];
        if (data && !data.allFiles && data.allFile.edges) {
            chatitoFiles = data.allFile.edges.map((edge: any) => ({
                title: `${edge.node.name}.${edge.node.extension}`,
                value: edge.node.fields.chatitoDSL
            }));
        }

        return (
            <Layout location={location} addPadding>
                <Editor tabs={chatitoFiles}>{(tdp: ITrainingDashboardProps) => <TrainingDashboard {...tdp} />}</Editor>
            </Layout>
        );
    }
}

export const query = graphql`
    query ChatitoFiles {
        allFile(filter: { extension: { eq: "chatito" }, relativePath: { glob: "typescript/examples/en/intents/*.chatito" } }) {
            edges {
                node {
                    name
                    extension
                    dir
                    relativePath
                    fields {
                        chatitoDSL
                    }
                }
            }
        }
    }
`;
