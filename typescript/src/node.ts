import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-node';
// import '@tensorflow/tfjs-node-gpu'; // USE GPU IF USING LINUX AND CUDA SETUP AFTER 'npm i --save @tensorflow/tfjs-node-gpu'
import { AidaPipeline } from './pipelines/zebraWings/pipeline';
import * as types from './types';
import { buildDictionary } from './utils/dictionaryUtils';

const logger: types.IPipelineModelLogger = {
    // tslint:disable:no-console
    debug: () => null,
    error: console.error,
    log: console.log,
    warn: console.warn
    // tslint:enable:no-console
};

const trainTestAndSaveModels = async () => {
    const embeddingDictionaryJson = require('../public/models/dictionary.json');
    const datasetParams: types.IDatasetParams = require('../public/models/dataset_params.json');
    const trainDataset: types.ITrainingParams = require('../public/models/dataset_training.json');
    const testDataset: types.ITestingParams = require('../public/models/dataset_testing.json');
    const dictionary = buildDictionary(embeddingDictionaryJson);
    const pipeline = new AidaPipeline({ datasetParams, dictionary, logger });
    await pipeline.train(trainDataset);
    const stats = await pipeline.test(testDataset);
    logger.log(stats);
    await pipeline.save({
        classificationPath: 'file://public/models/pretrained/node/classification',
        nerPath: 'file://public/models/pretrained/node/ner'
    });
    return pipeline;
};

const loadSavedModels = async () => {
    const embeddingDictionaryJson: any = require('../public/models/dictionary.json');
    const datasetParams: types.IDatasetParams = require('../public/models/dataset_params.json');
    const pretrainedClassifier = await tf.loadModel('file://public/models/pretrained/node/classification/model.json');
    const pretrainedNer = await tf.loadModel('file://public/models/pretrained/node/ner/model.json');
    const dictionary = buildDictionary(embeddingDictionaryJson);
    const pipeline = new AidaPipeline({ datasetParams, dictionary, logger, pretrainedClassifier, pretrainedNer });
    const testDataset: types.ITestingParams = require('../public/models/dataset_testing.json');
    const stats = await pipeline.test(testDataset);
    logger.log(stats);
    return pipeline;
};

trainTestAndSaveModels();
// loadAndTestSavedModels();
