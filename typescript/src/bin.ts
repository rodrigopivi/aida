#!/usr/bin/env node
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-node';
// TODO: Allow loading GPU
// import '@tensorflow/tfjs-node-gpu';
import * as webAdapter from 'chatito/dist/adapters/web';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { merge } from 'lodash';
import * as path from 'path';
import { AidaPipeline, defaultPipelineDefinition } from './pipelines/zebraWings/pipeline';
import * as types from './types';
import { datasetGeneration } from './utils/datasetUtils';

// tslint:disable-next-line:no-var-requires
const argv = require('minimist')(process.argv.slice(2));
const logger: types.IPipelineModelLogger = {
    // tslint:disable:no-console
    debug: () => null,
    error: console.error,
    log: console.log,
    warn: console.warn
    // tslint:enable:no-console
};
const workingDirectory = process.cwd();
const getFileWithPath = (filename: string) => path.resolve(workingDirectory, filename);

export interface IAidaConfig {
    chatito: {
        inputPath: string;
        outputPath: string;
    };
    aida: {
        outputPath: string;
        language: 'en' | 'es';
    };
}

(async () => {
    if (!argv._ || !argv._.length) {
        // tslint:disable-next-line:no-console
        console.error('Invalid config file.');
        process.exit(1);
    }
    const configFile = argv._[0];
    const action = (argv.action || '').toLowerCase();
    if (['dataset', 'train', 'test'].indexOf(action) === -1) {
        // tslint:disable-next-line:no-console
        console.error(`Invalid action argument: ${action}`);
        process.exit(1);
    }
    // const isDirectory = fs.existsSync(configFilePath) && fs.lstatSync(configFilePath).isDirectory();
    try {
        const configFilePath = getFileWithPath(configFile);
        const config: IAidaConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        if (
            !config.chatito ||
            !config.chatito.inputPath ||
            !config.chatito.outputPath ||
            !config.aida ||
            !config.aida.outputPath ||
            !config.aida.language
        ) {
            // tslint:disable-next-line:no-console
            console.error(`Invalid configuration file.`);
            process.exit(1);
        }
        const chatitoInputPath = getFileWithPath(config.chatito.inputPath);
        const chatitoOutputPath = getFileWithPath(config.chatito.outputPath);
        const aidaOutputPath = getFileWithPath(config.aida.outputPath);
        const aidaTrainingDatasetPath = path.resolve(aidaOutputPath, 'dataset_training.json');
        const aidaTestingDatasetPath = path.resolve(aidaOutputPath, 'dataset_testing.json');
        const aidaDatasetParamsPath = path.resolve(aidaOutputPath, 'dataset_params.json');
        const pretrainedNGramVectors = new Map<string, Float32Array>(require('../dictionary/dictionary.json'));
        const ngramToIdDictionary: { [key: string]: number } = require('../dictionary/ngram_to_id_dictionary.json');

        if (action === 'dataset') {
            execSync(
                `npx chatito ${chatitoInputPath} --outputPath="${chatitoOutputPath}" --trainingFileName="train.json" --testingFileName="test.json"`,
                { stdio: 'inherit' }
            );
            const testingChatitoDataset: webAdapter.IDefaultDataset = JSON.parse(
                fs.readFileSync(`${chatitoOutputPath}/train.json`, 'utf8')
            );
            const trainingChatitoDataset: webAdapter.IDefaultDataset = JSON.parse(
                fs.readFileSync(`${chatitoOutputPath}/test.json`, 'utf8')
            );
            datasetGeneration({
                language: 'en',
                outputPath: aidaOutputPath,
                testingChatitoDataset,
                trainingChatitoDataset
            });
            return;
        } else {
            const pipelineDefinition = merge({}, defaultPipelineDefinition, { config: { default: { batchSize: 120 } } });
            const datasetParams: types.IDatasetParams = JSON.parse(fs.readFileSync(aidaDatasetParamsPath, 'utf8'));
            if (action === 'train') {
                const trainingDataset: types.ITrainingParams = JSON.parse(fs.readFileSync(aidaTrainingDatasetPath, 'utf8'));
                const pipeline = new AidaPipeline({
                    datasetParams,
                    logger,
                    ngramToIdDictionary,
                    pipelineDefinition,
                    pretrainedNGramVectors
                });
                await pipeline.train(trainingDataset);
                await pipeline.save({
                    classificationPath: `file://${config.aida.outputPath}/classification`,
                    embeddingPath: `file://${config.aida.outputPath}/embedding`,
                    nerPath: `file://${config.aida.outputPath}/ner`
                });
            } else if (action === 'test') {
                const testingDataset: types.ITestingParams = JSON.parse(fs.readFileSync(aidaTestingDatasetPath, 'utf8'));
                const pretrainedEmbedding = await tf.loadLayersModel(`file://${config.aida.outputPath}/classification/model.json`, {
                    strict: false
                });
                const pretrainedClassifier = await tf.loadLayersModel(`file://${config.aida.outputPath}/embedding/model.json`);
                const pretrainedNer = await tf.loadLayersModel(`file://${config.aida.outputPath}/ner/model.json`);
                const pipeline = new AidaPipeline({
                    datasetParams,
                    logger,
                    ngramToIdDictionary,
                    pretrainedClassifier,
                    pretrainedEmbedding,
                    pretrainedNer
                });
                const stats = await pipeline.test(testingDataset);
                logger.log(stats);
            }
        }
    } catch (e) {
        // tslint:disable:no-console
        if (e && e.message && e.location) {
            console.log('==== CHATITO SYNTAX ERROR ====');
            console.log('    ', e.message);
            console.log(`     Line: ${e.location.start.line}, Column: ${e.location.start.column}`);
            console.log('==============================');
        } else {
            console.error(e && e.stack ? e.stack : e);
        }
        console.log('FULL ERROR REPORT:');
        console.error(e);
        // tslint:enable:no-console
        process.exit(1);
    }
})();
