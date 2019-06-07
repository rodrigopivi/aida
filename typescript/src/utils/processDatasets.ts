import * as webAdapter from 'chatito/dist/adapters/web';
import * as fs from 'fs';
import * as path from 'path';
import { IAidaPipelineConfig } from '../types';
import { datasetGeneration, getTokenizerAndDictionaryForLanguage } from './datasetUtils';
import { buildDictionary } from './dictionaryUtils';

async function copyFile(source: string, target: string) {
    const rd = fs.createReadStream(source);
    const wr = fs.createWriteStream(target, { flags: 'w' });
    try {
        return await new Promise((resolve, reject) => {
            rd.on('error', reject);
            wr.on('error', reject);
            wr.on('finish', resolve);
            rd.pipe(wr);
        });
    } catch (error) {
        // tslint:disable-next-line:no-console
        console.error(error);
        rd.destroy();
        wr.end();
    }
}

const processDataset = async (configFile: string) => {
    const config: IAidaPipelineConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), configFile), 'utf8'));
    const { dictionary } = getTokenizerAndDictionaryForLanguage(config.language);
    const fullTrainingDatasetPath = path.join(process.cwd(), config.dataset.trainingDataset);
    const fullTestingDatasetPath = path.join(process.cwd(), config.dataset.testingDataset);
    const trainingChatitoDataset: webAdapter.IDefaultDataset = JSON.parse(fs.readFileSync(fullTrainingDatasetPath, 'utf8'));
    const testingChatitoDataset: webAdapter.IDefaultDataset = JSON.parse(fs.readFileSync(fullTestingDatasetPath, 'utf8'));

    datasetGeneration({
        language: 'en',
        outputPath: config.dataset.modelsOutput,
        testingChatitoDataset,
        trainingChatitoDataset
    });
    process.stdout.write(`Copying relevant files to dir: ${config.dataset.modelsOutput}\n`);
    await copyFile(dictionary, path.join(process.cwd(), config.dataset.modelsOutput, 'dictionary.json'));
    const dictionaryData = JSON.parse(fs.readFileSync(path.join(process.cwd(), config.dataset.modelsOutput, 'dictionary.json'), 'utf8'));
    const { NGRAM_TO_ID_MAP } = buildDictionary(dictionaryData);
    fs.writeFileSync(path.join(process.cwd(), config.dataset.modelsOutput, 'ngram_to_id_dictionary.json'), JSON.stringify(NGRAM_TO_ID_MAP));
    process.stdout.write(`NOTE! non-relevant files will be removed later\n`);
};

// This script is intended to be used from the command line passing the language as unique param to generate the dictionary
if (process && process.argv && process.argv.length > 2) {
    const configPath = process.argv[2];
    processDataset(configPath);
}
