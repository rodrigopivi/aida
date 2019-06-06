import * as tf from '@tensorflow/tfjs';
import { Button, Card, Col, Progress, Row, Select } from 'antd';
import axios from 'axios';
import { withPrefix } from 'gatsby-link';
import * as React from 'react';
import { AidaPipeline } from '../../src/pipelines/zebraWings/pipeline';
import * as types from '../../src/types';
import TestPipelineChat from './Chat/TestPipelineChat';

interface ILoadPreTrainedExample {
    downloadProgress: number;
    isDownloading: boolean;
    modelsLoaded: boolean;
    selectedModel: 'web' | 'node' | 'keras';
}
export default class LoadPreTrainedExample extends React.Component<{}, ILoadPreTrainedExample> {
    public state: ILoadPreTrainedExample = {
        downloadProgress: 0,
        isDownloading: false,
        modelsLoaded: false,
        selectedModel: 'web'
    };
    private pipeline: AidaPipeline | null = null;
    private logger: types.IPipelineModelLogger = {
        // tslint:disable:no-console
        debug: () => null,
        error: console.error,
        log: console.log,
        warn: console.warn
        // tslint:enable:no-console
    };

    public componentWillUnmount() {
        // tslint:disable-next-line:no-console
        console.log(tf.memory());
        tf.disposeVariables();
        (window as any).tf = tf;
    }

    public render() {
        if (this.state.modelsLoaded && this.pipeline) {
            return <TestPipelineChat pipeline={this.pipeline}>{this.renderIntentsList()}</TestPipelineChat>;
        }
        const disableDownload = this.state.isDownloading || this.state.downloadProgress === 100;
        const buttonMessage = disableDownload
            ? this.state.downloadProgress === 100
                ? 'Loading Models...'
                : 'Downloading...'
            : 'Start demo';
        return (
            <Row type="flex">
                <Col span={24} sm={{ span: 12 }} style={{ margin: 'auto' }}>
                    <Card style={{ marginLeft: '2em', textAlign: 'center' }}>
                        <div>
                            <Progress type="circle" percent={this.state.downloadProgress} />
                        </div>
                        <div style={{ marginTop: '1em', marginBottom: '1em' }}>
                            <Select
                                defaultValue={this.state.selectedModel}
                                style={{ maxWidth: '100%' }}
                                onChange={v => this.setState({ selectedModel: v as 'web' | 'node' | 'keras' })}
                            >
                                <Select.Option value="web">Load web trained models</Select.Option>
                                <Select.Option value="node">Load node trained models</Select.Option>
                                <Select.Option value="keras">Load keras trained models</Select.Option>
                            </Select>
                        </div>
                        <div>
                            <Button type="primary" size="large" disabled={disableDownload} onClick={this.loadSavedModels}>
                                {buttonMessage}
                            </Button>
                        </div>
                        <br />
                        <p>Will download the trained models (about 5mb)</p>
                    </Card>
                </Col>
            </Row>
        );
    }

    private renderIntentsList = () => {
        return (
            <div>
                <p>The pipeline was trained on this list of intents and slots per intent:</p>
                <div>
                    <ul>
                        <li>greet</li>
                        <li>bye</li>
                        <li>affirmative</li>
                        <li>negative</li>
                        <li>wtf (detect insults and out of context stuff)</li>
                        <li>playMusic -> slots: artist, song</li>
                        <li>addEventToCalendar -> slots: calendarEvent, dateTime</li>
                    </ul>
                </div>
                <p>
                    You can try a sentence like 'please remind to me watch real madrid match tomorrow at 9pm' or 'play new york new york
                    from frank sinatra'
                </p>
                <p>
                    Check the{' '}
                    <a target="_blank" href="https://github.com/rodrigopivi/aida/tree/master/typescript/examples/en/intents">
                        chatito definition files at the github repo
                    </a>
                    &nbsp; for more details about the training examples generation.
                </p>
            </div>
        );
    };

    private downloadsTrainedModel = async (backend: 'web' | 'node' | 'keras') => {
        const modelsUrls = {
            keras: {
                classification: withPrefix('/models/pretrained/keras/classification/model.json'),
                embedding: withPrefix('/models/pretrained/keras/embedding/model.json'),
                ner: withPrefix('/models/pretrained/keras/ner/model.json')
            },
            node: {
                classification: withPrefix('/models/pretrained/node/classification/model.json'),
                embedding: withPrefix('/models/pretrained/node/embedding/model.json'),
                ner: withPrefix('/models/pretrained/node/ner/model.json')
            },
            web: {
                classification: withPrefix('/models/pretrained/web/classification.json'),
                embedding: withPrefix('/models/pretrained/web/embedding.json'),
                ner: withPrefix('/models/pretrained/web/ner.json')
            }
        };
        const pretrainedEmbedding = await tf.loadLayersModel(modelsUrls[backend].embedding);
        const pretrainedClassifier = await tf.loadLayersModel(modelsUrls[backend].classification);
        const pretrainedNer = await tf.loadLayersModel(modelsUrls[backend].ner);
        return { pretrainedEmbedding, pretrainedClassifier, pretrainedNer };
    };

    private loadSavedModels = async () => {
        const files = [withPrefix('/models/ngram_to_id_dictionary.json'), withPrefix('/models/dataset_params.json')];
        const jsonFiles = await this.downloadFiles(files);
        const ngramToIdDictionary = jsonFiles[0].data;
        const datasetParams = jsonFiles[1].data;
        const { pretrainedClassifier, pretrainedNer, pretrainedEmbedding } = await this.downloadsTrainedModel(this.state.selectedModel);
        const logger = this.logger;
        const pipeline = new AidaPipeline({
            datasetParams,
            logger,
            ngramToIdDictionary,
            pretrainedClassifier,
            pretrainedEmbedding,
            pretrainedNer
        });
        this.pipeline = pipeline;
        this.setState({ modelsLoaded: true });
        return pipeline;
    };

    private downloadFiles = async (files: string[]) => {
        let total = 0;
        let progress = 0;
        this.setState({ isDownloading: true, downloadProgress: 0 });
        const downloads = await Promise.all(
            files.map(file =>
                axios.get(file, {
                    onDownloadProgress: progressEvent => {
                        const totalLength = progressEvent.lengthComputable
                            ? progressEvent.total
                            : progressEvent.target.getResponseHeader('content-length') ||
                              progressEvent.target.getResponseHeader('x-decompressed-content-length');
                        if (totalLength !== null) {
                            total += totalLength;
                            progress += Math.round((progressEvent.loaded * 100) / total);
                        }
                        this.setState({ downloadProgress: progress });
                    }
                })
            )
        );
        this.setState({ isDownloading: false, downloadProgress: 100 });
        return downloads;
    };
}
