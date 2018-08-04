import { Col, Icon, Row } from 'antd';
import Link from 'gatsby-link';
import * as React from 'react';
import styled from 'styled-components';

// tslint:disable-next-line:no-var-requires
const QueueAnim = require('rc-queue-anim').default;

const Wrapper = styled.section`
    width: 100%;
    padding: 0;
    overflow: hidden;
    background: #f8fafe;
    padding-bottom: 100px;
    overflow: initial;
    min-height: 372px;
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
            margin-bottom: 65px;
            display: inline-block;
            width: 30px;
            height: 5px;
            background: #1890ff;
            border-radius: 2.5px;
        }
    }
    .card {
        transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        position: relative;
        color: #868e96;
        display: inline-block;
        max-width: 360px;
        width: 100%;
        height: 312px;
        padding: 32px;
        box-shadow: 0 2px 2px rgba(84, 48, 132, 0.06);
        margin: 0 auto;
        flex-direction: column;
        word-wrap: break-word;
        background-color: #fff;
        background-clip: border-box;
        text-align: center;
        border-radius: 4px;
        .card-img-top {
            width: 100%;
            border-top-left-radius: calc(0.25rem - 1px);
            border-top-right-radius: calc(0.25rem - 1px);
        }
        h3 {
            font-size: 30px;
        }
        img {
            height: 50px;
            margin: 20px 0;
        }
        &:hover {
            text-decoration: none;
            transform: translateY(-12px);
            box-shadow: 0 12px 24px rgba(84, 48, 132, 0.06);
        }
    }
`;

export default function LandingSecondary() {
    return (
        <Wrapper>
            <QueueAnim component={Row} type="bottom" className="page row text-center" delay={500}>
                <Col className="card-wrapper" key="1" md={8} xs={24}>
                    <Link className="card" href="/overview" to="/overview">
                        <h3>Dataset generation</h3>
                        <Icon type="database" style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '6em', paddingBottom: '.3em' }} />
                        <div className="card-body">
                            <span className="title">
                                Generate and modularize datasets for natural language understanding neural network models in a breeze using
                                Chatito DSL.
                            </span>
                        </div>
                    </Link>
                </Col>
                <Col className="card-wrapper" key="2" md={8} xs={24}>
                    <Link className="card" href="/overview" to="/overview">
                        <h3>Run everywhere</h3>
                        <Icon type="rocket" style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '6em', paddingBottom: '.3em' }} />
                        <div className="card-body">
                            <span className="title">
                                Implemented with TF.js and Keras to train from browsers, nodejs or python and run everywhere including iOS,
                                Android and IoT.
                            </span>
                        </div>
                    </Link>
                </Col>
                <Col className="card-wrapper" key="3" md={8} xs={24}>
                    <Link className="card" href="/overview" to="/overview">
                        <h3>Easy integration</h3>
                        <Icon type="api" style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '6em', paddingBottom: '.3em' }} />
                        <div className="card-body">
                            <span className="title">
                                Fully customizable, open source, low memory, works offline, runs in device. Use the tools and environment
                                you choose.
                            </span>
                        </div>
                    </Link>
                </Col>
            </QueueAnim>
        </Wrapper>
    );
}
