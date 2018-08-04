import * as tf from '@tensorflow/tfjs';
import { Button, Card, Col, Progress, Row, Select } from 'antd';
import axios from 'axios';
import { withPrefix } from 'gatsby-link';
import * as React from 'react';
import { AidaPipeline } from '../../src/pipelines/zebraWings/pipeline';
import * as types from '../../src/types';
import { buildDictionary } from '../../src/utils/dictionaryUtils';
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

    // public componentWillUnmount() {
    //     // tslint:disable-next-line:no-console
    //     console.log(tf.memory());
    //     tf.disposeVariables();
    //     (window as any).tf = tf;
    // }

    public render() {
        if (this.state.modelsLoaded && this.pipeline) {
            return <TrainedPipelineTestInput pipeline={this.pipeline} />;
        }
        const disableDownload = this.state.isDownloading || this.state.downloadProgress === 100;
        const buttonMessage = disableDownload
            ? this.state.downloadProgress === 100
                ? 'Loading Models...'
                : 'Downloading...'
            : 'Start example';
        return (
            <Row type="flex">
                <Col span={12}>
                    <h2>Online pre-trained example</h2>
                    <p>
                        This example shows a trained pipeline running from the browser, you can also download the model and run it from
                        other environments like node, or train one to run in python or export it to mobile devices too.
                    </p>
                    <p>
                        The pipeline is composed of two models. Text classification model determines the intent of a sentence, and named
                        entity recognition model extracts the slots. Both models were trained with thousands of example sentences generated
                        easily using{' '}
                        <a href="https://rodrigopivi.github.io/Chatito/" target="_blank">
                            Chatito DSL
                        </a>
                        . Both models implement minimalistic close to state of the art deep learning networks that are implemented to train
                        in multiple runtimes thanks to{' '}
                        <a href="https://js.tensorflow.org/" target="_blank">
                            Tensorflow.js
                        </a>{' '}
                        for javascript and{' '}
                        <a href="https://keras.io/" target="_blank">
                            Keras
                        </a>{' '}
                        for Python. The embeddings dictionary for each language is created from pre-trained{' '}
                        <a href="https://fasttext.cc/" target="_blank">
                            FastText
                        </a>{' '}
                        files that are filtered to only use n-grams of 3 letters or less, to reduce the size of the model from several
                        gigabytes to few megabytes. The simplicity of the pipeline comes from all this tools working together.
                    </p>
                    <p>Click 'start example' to continue.</p>
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
                        <p>Will download the pre-trained models (about 20mb compressed)</p>
                    </Card>
                </Col>
            </Row>
        );
    }

    private downloadsTrainedModel = async (backend: 'web' | 'node' | 'keras') => {
        const modelsUrls = {
            keras: {
                classification: withPrefix('/models/pretrained/keras/classification/model.json'),
                ner: withPrefix('/models/pretrained/keras/ner/model.json')
            },
            node: {
                classification: withPrefix('/models/pretrained/node/classification/model.json'),
                ner: withPrefix('/models/pretrained/node/ner/model.json')
            },
            web: {
                classification: withPrefix('/models/pretrained/web/classification.json'),
                ner: withPrefix('/models/pretrained/web/ner.json')
            }
        };
        const pretrainedClassifier = await tf.loadModel(modelsUrls[backend].classification);
        const pretrainedNer = await tf.loadModel(modelsUrls[backend].ner);
        return { pretrainedClassifier, pretrainedNer };
    };

    private loadSavedModels = async () => {
        const files = [withPrefix('/models/dictionary.json'), withPrefix('/models/dataset_params.json')];
        const jsonFiles = await this.downloadFiles(files);
        const embeddingDictionaryJson = jsonFiles[0].data;
        const datasetParams = jsonFiles[1].data;
        const { pretrainedClassifier, pretrainedNer } = await this.downloadsTrainedModel(this.state.selectedModel);
        const dictionary = buildDictionary(embeddingDictionaryJson);
        const logger = this.logger;
        const pipeline = new AidaPipeline({ datasetParams, dictionary, logger, pretrainedClassifier, pretrainedNer });
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
