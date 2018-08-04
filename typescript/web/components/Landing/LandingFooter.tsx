import { Col, Row } from 'antd';
import * as React from 'react';
import styled from 'styled-components';

const Footer = styled.footer`
    background-color: #4c4c4c;
    color: rgba(255, 255, 255, 0.65);
    clear: both;
    font-size: 12px;
    position: relative;
    .bottom-bar {
        border-top: 1px solid #4c4c4c;
        text-align: right;
        padding: 20px 24px;
        margin: 0;
        line-height: 24px;
    }
`;

export default function LandingFooter() {
    return (
        <Footer id="footer">
            <Row className="bottom-bar">
                <Col lg={6} sm={24} />
                <Col lg={18} sm={24}>
                    <span style={{ marginRight: 12 }}>© 2018 Rodrigo Pimentel</span>
                </Col>
            </Row>
        </Footer>
    );
}
