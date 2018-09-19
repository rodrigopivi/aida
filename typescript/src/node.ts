import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-node';
// import '@tensorflow/tfjs-node-gpu'; // USE GPU IF USING LINUX AND CUDA SETUP AFTER 'npm i --save @tensorflow/tfjs-node-gpu'
import { merge } from 'lodash';
import { AidaPipeline, defaultPipelineDefinition } from './pipelines/zebraWings/pipeline';
import * as types from './types';

const logger: types.IPipelineModelLogger = {
    // tslint:disable:no-console
    debug: () => null,
    error: console.error,
    log: console.log,
    warn: console.warn
    // tslint:enable:no-console
};

const trainTestAndSaveModels = async () => {
    const pretrainedNGramVectors = new Map<string, Float32Array>(require('../public/models/dictionary.json'));
    const ngramToIdDictionary: { [key: string]: number } = require('../public/models/ngram_to_id_dictionary.json');
    const datasetParams: types.IDatasetParams = require('../public/models/dataset_params.json');
    const trainDataset: types.ITrainingParams = require('../public/models/dataset_training.json');
    const testDataset: types.ITestingParams = require('../public/models/dataset_testing.json');
    const pipelineDefinition = merge({}, defaultPipelineDefinition, { config: { default: { batchSize: 120 } } });
    const pipeline = new AidaPipeline({
        datasetParams,
        logger,
        ngramToIdDictionary,
        pipelineDefinition,
        pretrainedNGramVectors
    });
    await pipeline.train(trainDataset);
    const stats = await pipeline.test(testDataset);
    logger.log(stats);
    await pipeline.save({
        classificationPath: 'file://public/models/pretrained/node/classification',
        embeddingPath: 'file://public/models/pretrained/node/embedding',
        nerPath: 'file://public/models/pretrained/node/ner'
    });
    return pipeline;
};

const loadSavedModels = async () => {
    const ngramToIdDictionary: { [key: string]: number } = require('../public/models/ngram_to_id_dictionary.json');
    const datasetParams: types.IDatasetParams = require('../public/models/dataset_params.json');
    const pretrainedEmbedding = await tf.loadModel('file://public/models/pretrained/node/embedding/model.json');
    const pretrainedClassifier = await tf.loadModel('file://public/models/pretrained/node/classification/model.json');
    const pretrainedNer = await tf.loadModel('file://public/models/pretrained/node/ner/model.json');
    const pipeline = new AidaPipeline({
        datasetParams,
        logger,
        ngramToIdDictionary,
        pretrainedClassifier,
        pretrainedEmbedding,
        pretrainedNer
    });
    const testDataset: types.ITestingParams = require('../public/models/dataset_testing.json');
    const stats = await pipeline.test(testDataset);
    logger.log(stats);
    return pipeline;
};

trainTestAndSaveModels();
// loadAndTestSavedModels();
