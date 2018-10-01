import { Button, Col, Row } from 'antd';
import Link from 'gatsby-link';
import * as React from 'react';
import styled from 'styled-components';
import { ColoredText } from '../Logo';
import LandingImage from './LandingImage';

// tslint:disable-next-line:no-var-requires
const QueueAnim = require('rc-queue-anim').default;
// tslint:disable-next-line:no-var-requires
const OverPack = require('rc-scroll-anim/lib/ScrollOverPack');

const OP = styled(OverPack)`
    background-color: #f8fafe;
    width: 100%;
    padding: 0;
    overflow: hidden;
    min-height: 405px;
    .page {
        width: 90%;
        max-width: 1200px;
        margin: auto;
        position: relative;
        h2 {
            margin-bottom: 30px;
            font-size: 2rem;
        }
        .separator {
            margin-bottom: 35px;
            display: inline-block;
            width: 30px;
            height: 5px;
            background: #1890ff;
            border-radius: 2.5px;
        }
    }
    .page {
        padding: 62px 0 32px;
    }
    .info-content {
        max-width: 900px;
        line-height: 48px;
        margin: 0 auto;
        font-size: 20px;
        font-weight: 300;
    }
    .text-center: {
        text-align: center;
    }
`;

export default function LandingMain() {
    return (
        <OP component="section">
            <Row type="flex" className="page text-center">
                <Col span={17}>
                    <QueueAnim type="bottom" leaveReverse key="landing-main">
                        <ColoredText style={{ display: 'block', fontSize: '2.1em' }} className="animated">
                            Build conversational user experiences
                        </ColoredText>
                        <span key="line" className="separator" />
                        <QueueAnim type="bottom" className="info-content" key="landing-main-content">
                            <span key="1">Your application can understand natural language in house.</span>
                            <br />
                            <span key="2">
                                Use open source AI models that can train from the browser using javascript or python and can run everywhere.
                            </span>
                            <br />
                            <Link to="/start" key="3">
                                <Button type="primary">Get started</Button>
                            </Link>
                        </QueueAnim>
                    </QueueAnim>
                </Col>
                <Col span={7} style={{ textAlign: 'center', margin: 'auto' }}>
                    <LandingImage />
                </Col>
            </Row>
        </OP>
    );
}
