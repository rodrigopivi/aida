import { Icon } from 'antd';
import Link from 'gatsby-link';
import * as React from 'react';
import styled from 'styled-components';
import { Logo } from '../Logo';

const Header = styled.header`
    height: 64px;
    padding: 0 32px;
    width: 100%;
    .github-link {
        float: right;
        height: 100%;
        line-height: 64px;
    }
`;

export default function LandingHeader() {
    return (
        <Header key="landing-header">
            <Logo style={{ lineHeight: '64px' }} className="static">
                <Link to="/">{`< Aida />`}</Link>
            </Logo>
            <div className="github-link">
                <a href="https://github.com/rodrigopivi/aida" title="Aida" style={{ fontSize: 26 }}>
                    <Icon type="github" />
                </a>
            </div>
        </Header>
    );
}
