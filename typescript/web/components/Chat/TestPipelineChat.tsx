import { Card, Col, Row } from 'antd';
import * as React from 'react';
import styled from 'styled-components';
import { AidaPipeline } from '../../../src/pipelines/zebraWings/pipeline';
import ChatWidget from './ChatWidget';

interface IPipelineTestInputProps {
    pipeline: AidaPipeline;
}
interface IPipelineTestInputState {
    lastPipelineOutput: string | null;
}
const ChatWrapper = styled.div`
    margin-bottom: 20px;
    .rsc-container {
        margin: auto;
        h2.rsc-header-title {
            color: #fff !important;
        }
    }
`;
export default class TestPipelineChat extends React.Component<IPipelineTestInputProps, IPipelineTestInputState> {
    public state: IPipelineTestInputState = {
        lastPipelineOutput: null
    };

    public render() {
        return (
            <div>
                <Row type="flex" justify="center">
                    <Col span={24} sm={{ span: 12 }}>
                        <ChatWrapper>
                            <ChatWidget predict={this.predict} />
                        </ChatWrapper>
                    </Col>
                    <Col span={24} sm={{ span: 12 }}>
                        <Card style={{ minHeight: '100%' }}>
                            <div style={{ fontSize: 10 }}>{this.props.children || null}</div>
                            <div style={{ fontSize: 12 }}>
                                <p>
                                    <strong>Last input evaluation:</strong>
                                </p>
                                <pre style={{ marginTop: '2em' }}>{this.state.lastPipelineOutput || ''}</pre>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    public predict = (sentence: string) => {
        if (!sentence || !sentence.trim()) {
            return null;
        }
        const predictions = this.props.pipeline.predict([sentence]);
        const ret = Object.assign({}, predictions.classification[0], predictions.ner[0]);
        const lastPipelineOutput = JSON.stringify(ret, null, 2);
        this.setState({ lastPipelineOutput });
        return ret;
    };
}
