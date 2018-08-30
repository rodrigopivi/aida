import * as tf from '@tensorflow/tfjs';
import { Button, Card, Col, Progress, Row, Select } from 'antd';
import axios from 'axios';
import { withPrefix } from 'gatsby-link';
import * as React from 'react';
import { AidaPipeline } from '../../src/pipelines/zebraWings/pipeline';
import * as types from '../../src/types';
import TrainedPipelineTestInput from './TrainedPipelineTestInput';

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
            return <TrainedPipelineTestInput pipeline={this.pipeline} />;
        }
        const disableDownload = this.state.isDownloading || this.state.downloadProgress === 100;
        const buttonMessage = disableDownload
            ? this.state.downloadProgress === 100
                ? 'Loading Models...'
                : 'Downloading...'
            : 'Start demo';
        return (
            <Row type="flex">
                <Col span={12} style={{ textAlign: 'justify' }}>
                    <h1>Build conversational user experiences</h1>
                    <h3>Aida is a library that helps you build conversational user experiences with this concepts in mind:</h3>
                    <ul>
                        <li>
                            <strong>Universal application:</strong> The trained models should be able to run anywhere, that is why the
                            models have two mirror implementations: in{' '}
                            <a href="https://js.tensorflow.com/" target="_blank">
                                TensorflowJS
                            </a>{' '}
                            to be able to train and run from browsers or nodejs, and in{' '}
                            <a href="https://keras.io/" target="_blank">
                                Keras
                            </a>{' '}
                            to run in python and export to mobile devices (CoreML for iOS and TensorFlow for Android).
                        </li>
                        <li>
                            <strong>Offline support:</strong> It should be able to train and make predictions without connectivty, no need
                            to have a server-side api, although the trained models can also run server-side behind an api if desired.
                        </li>
                        <li>
                            <strong>Low memory consumption:</strong> Having small file size and memory consumption is very important if we
                            want to run from browsers. Most NLU models use huge dictionaries (several gigabytes size) like word2vec, to
                            solve this problem, we are only using pre-trained{' '}
                            <a href="https://fasttext.cc/" target="_blank">
                                fastText
                            </a>{' '}
                            bigram and unigram embeddings, this keeps the dictionary very small, fast to download.
                        </li>
                        <li>
                            <strong>Accurate:</strong> Carefully crafted, close to state of the art neural network models for text
                            classification and named entity recognition, the models will only get better as the field progresses and the
                            community expands.
                        </li>
                        <li>
                            <strong>Easy to use:</strong> Getting started by creating a dataset and training couldn't be easier thanks to{' '}
                            <a href="https://rodrigopivi.github.io/Chatito" target="_blank">
                                Chatito
                            </a>
                            , you can create a large dataset in minutes, and start training without any setup, just from the browser.
                        </li>
                    </ul>
                    <p>Click 'start demo' to continue.</p>
                </Col>
                <Col span={12}>
                    <Card style={{ marginLeft: '2em', textAlign: 'center' }}>
                        <div>
                            <Progress type="circle" percent={this.state.downloadProgress} />
                        </div>
                        <div style={{ marginTop: '1em', marginBottom: '1em' }}>
                            <Select
                                defaultValue={this.state.selectedModel}
                                style={{ width: 280 }}
                                onChange={v => this.setState({ selectedModel: v as 'web' | 'node' | 'keras' })}
                            >
                                <Select.Option value="web">Load models trained using tf.js web</Select.Option>
                                <Select.Option value="node">Load models trained using tf.js node</Select.Option>
                                <Select.Option value="keras">Load models trained using keras</Select.Option>
                            </Select>
                        </div>
                        <div>
                            <Button type="primary" size="large" disabled={disableDownload} onClick={this.loadSavedModels}>
                                {buttonMessage}
                            </Button>
                        </div>
                        <br />
                        <p>Will download the trained model (about 3mb compressed)</p>
                    </Card>
                </Col>
            </Row>
        );
    }

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
        const pretrainedEmbedding = await tf.loadModel(modelsUrls[backend].embedding);
        const pretrainedClassifier = await tf.loadModel(modelsUrls[backend].classification);
        const pretrainedNer = await tf.loadModel(modelsUrls[backend].ner);
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
