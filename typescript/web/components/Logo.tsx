import '@babel/polyfill';
import styled from 'styled-components';

// The Button from the last section without the interpolations
export const ColoredText = styled.div`
    @keyframes text-gradient {
        to {
            background-position: -300% center;
        }
    }
    font-weight: bold;
    color: #1890ff;
    display: inline-block;
    text-decoration: none;
    background-image: linear-gradient(to right, #1890ff 25%, #c4ce35 50%, #ac24e2 75%, #1890ff 100%);
    background-size: 300% auto;
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: text-gradient 16s ease-in-out infinite;
`;

export const Logo = ColoredText.extend`
    text-align: center;
    font-size: 19px;
`;
