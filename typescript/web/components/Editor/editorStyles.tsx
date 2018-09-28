import styled from 'styled-components';

export const AlertNotification = styled.div`
    width: 100%;
    background-color: ${({ state }: { state: 'error' | 'warning' | 'success' }) =>
        state === 'error' ? '#c80000' : state === 'warning' ? '#7f8000' : '#008800'};
    bottom: 0;
    margin: auto;
    right: 0;
    text-align: center;
    padding: 12px;
    color: white;
    z-index: 99;
    font-size: 14px;
`;

const editorOutsideBg = '#D0D2D5';
const editorInsideBg = '#f8f8f8';

export const CodeStyles = styled.div`
    white-space: pre-wrap;
    position: relative;
    margin: auto;
    width: inherit;
    height: calc(100vh - 330px) !important;
    min-height: 350px;
    background-color: ${editorInsideBg};
    > .codeflask {
        background-color: ${editorInsideBg};
        > textarea.codeflask__textarea {
            color: ${editorInsideBg};
            caret-color: #343434;
        }
        &.codeflask--has-line-numbers {
            :before {
                background-color: ${editorOutsideBg};
            }
            > pre {
                width: auto !important;
            }
            div.codeflask__lines {
                z-index: 3;
                height: auto !important;
                padding: 10px 4px 0 0;
                > .codeflask__lines__line {
                    color: #6473a0;
                    background-color: ${editorOutsideBg};
                }
            }
        }
        *::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        *::-webkit-scrollbar-thumb {
            background-color: #7c7c9c;
            box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
        }
        *::-webkit-scrollbar-track {
            box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
        }
        *::-webkit-scrollbar-corner {
            background-color: transparent;
        }
    }
    .token.comments {
        color: #999;
    }
    .token.intentDefinition {
        color: #ff3636;
    }
    .token.slotDefinition {
        color: #d000ff;
    }
    .token.slot {
        color: #c000ee;
    }
    .token.alias {
        color: #3f51b5;
    }
    .token.default {
        color: #343434;
    }
    .token.intentArguments {
        color: #ff9191;
    }
    .token.slotArguments {
        color: #da7cee;
    }
`;

export const TabButton = styled.div`
    cursor: pointer;
    display: inline-block;
    background-color: ${({ active }: { active: boolean }) => (active ? editorInsideBg : editorOutsideBg)};
    font-size: 12px;
    color: #454545;
    padding: 13px 3px 13px 13px;
    border-right: 1px solid #d5d5d5;
    zoom: 1;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;

    i.anticon-close {
        margin-left: 8px;
        margin-right: 8px;
        color: #5c5c5c;
        :hover {
            color: #ff66ff;
        }
    }
`;

export const EditorHeader = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    max-width: 100%;
    background-color: ${editorOutsideBg};
    padding-left: 40px;
    padding-top: 10px;
`;

export const TabsArea = styled.div`
    width: auto;
    max-width: 100%;
    white-space: nowrap;
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar {
        height: 6px;
    }
    &::-webkit-scrollbar-thumb {
        background-color: #7c7c9c;
        -webkit-box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
    }
    &::-webkit-scrollbar-track {
        -webkit-box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
    }
    *::-webkit-scrollbar-corner {
        background-color: transparent;
    }
`;

export const EditorWrapper = styled.div`
    width: auto;
    overflow: auto;
    margin: auto;
    position: relative;
`;

export const StrokeText = styled.p`
    text-align: center;
    font-size: 12px;
    padding-top: 20px;
    color: #fff;
    text-shadow: -1px -1px 0 #444, 1px -1px 0 #444, -1px 1px 0 #444, 1px 1px 0 #444;
`;

export const Drawer = styled.div`
    z-index: 99;
    position: absolute;
    background-color: rgba(40, 40, 40, 0.8);
    -webkit-box-shadow: -5px 0px 5px -5px rgba(0, 0, 0, 0.55);
    -moz-box-shadow: -5px 0px 5px -5px rgba(0, 0, 0, 0.55);
    box-shadow: -5px 0px 5px -5px rgba(0, 0, 0, 0.55);
    top: 0;
    right: 0;
    max-width: 700px;
    height: 100%;
    width: ${({ showDrawer }: { showDrawer: boolean }) => (showDrawer ? `100%` : `0px`)};
    -webkit-transition: 0.65s ease;
    -moz-transition: 0.65s ease;
    -o-transition: 0.65s ease;
    transition: 0.65s ease;
    overflow: auto;

    > i.anticon-close {
        cursor: pointer;
        color: white;
        margin: 8px 20px 8px 20px;
        float: right;
        :hover {
            color: #ff66ff;
        }
    }
    .ant-progress .ant-progress-text {
        color: #fff;
    }
`;

export const EditorOverlay = styled.div`
    z-index: 999;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    visibility: ${({ showDrawer }: { showDrawer: boolean }) => (showDrawer ? 'visible' : 'hidden')};
    -webkit-transition: 0.25s ease;
    -moz-transition: 0.25s ease;
    -o-transition: 0.25s ease;
    transition: 0.25s ease;
    > i.anticon-loading {
        position: absolute;
        font-size: 50px;
        left: 50%;
        transform: translateX(-50%);
        top: 50%;
        transform: translateY(-50%);
    }
`;

export const BlockWrapper = styled.div`
    background-color: #e4e4e4;
    margin: 20px;
    overflow: auto;
    border-radius: 8px;
    -webkit-box-shadow: 0px 0px 50px 0px rgba(0, 0, 0, 0.4);
    -moz-box-shadow: 0px 0px 50px 0px rgba(0, 0, 0, 0.4);
    box-shadow: 0px 0px 50px 0px rgba(0, 0, 0, 0.4);
    clear: both;
`;

export const BlockWrapperTitle = styled.div`
    background-color: #6b5a86;
    color: #efefef;
    font-size: 13px;
    padding: 8px 10px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
`;
