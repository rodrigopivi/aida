import * as webAdapter from 'chatito/dist/adapters/web';
import * as fs from 'fs';
import * as path from 'path';
import englishTokenizer from '../languages/en/EnglishTokenizer';
import spanishTokenizer from '../languages/es/SpanishTokenizer';
import { IAidaPipelineConfig, IDatasetParams, ITestingParams, ITrainingParams } from '../types';
import { dictionariesFromDataset } from './dictionaryUtils';

function getTokenizerAndDictionaryForLanguage(language: 'en' | 'es') {
    const lang = language ? language.toLowerCase() : language;
    if (lang === 'en') {
        return { tokenizer: englishTokenizer, dictionary: path.join(__dirname, '../languages/en/dict.json') };
    } else if (lang === 'es') {
        return { tokenizer: spanishTokenizer, dictionary: path.join(__dirname, '../languages/es/dict.json') };
    }
    throw new Error("Invalid config language. Only 'en' and 'es' are supported.");
}

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

const datasetGeneration = async (configFile: string) => {
    const config: IAidaPipelineConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), configFile), 'utf8'));
    const FULL = {} as webAdapter.IDefaultDataset;
    const intentsFullPath = path.join(process.cwd(), config.dataset.chatitoInputsPath);
    for (const filename of fs.readdirSync(intentsFullPath)) {
        const filenameSplit = filename.split('.');
        const extension = filenameSplit.pop();
        if (extension !== 'chatito') {
            continue;
        }
        const chatitoGrammar = fs.readFileSync(intentsFullPath + '/' + filename, 'utf8');
        const fullFileDataset = await webAdapter.adapter(chatitoGrammar);
        for (const intentKey in fullFileDataset) {
            if (fullFileDataset.hasOwnProperty(intentKey)) {
                FULL[intentKey] = FULL[intentKey] ? FULL[intentKey].concat(fullFileDataset[intentKey]) : fullFileDataset[intentKey];
            }
        }
    }
    process.stdout.write(`Generation done, processing the dictionary...\n`);
    const { tokenizer, dictionary } = getTokenizerAndDictionaryForLanguage(config.language);
    const {
        dictionary: { maxWordsPerSentence, slotsToId, intents, intentsWithSlots, testX, testY, testY2, trainX, trainY, trainY2, language },
        stats
    } = dictionariesFromDataset(FULL, tokenizer, config.language, config.dataset.maxIntentExamplesForTraining);
    process.stdout.write(`Saving files...\n`);
    fs.writeFileSync(
        path.join(process.cwd(), config.dataset.datasetOutputPath, 'dataset_params.json'),
        JSON.stringify({
            intents,
            intentsWithSlots,
            language,
            maxWordsPerSentence,
            slotsToId
        } as IDatasetParams)
    );
    fs.writeFileSync(
        path.join(process.cwd(), config.dataset.datasetOutputPath, 'dataset_training.json'),
        JSON.stringify({
            trainX,
            trainY,
            trainY2
        } as ITrainingParams)
    );
    fs.writeFileSync(
        path.join(process.cwd(), config.dataset.datasetOutputPath, 'dataset_testing.json'),
        JSON.stringify({
            testX,
            testY,
            testY2
        } as ITestingParams)
    );
    await copyFile(dictionary, path.join(process.cwd(), config.dataset.datasetOutputPath, 'dictionary.json'));
    process.stdout.write(`Done! ${JSON.stringify(stats, null, 2)}`);
};

// This script is intended to be used from the command line passing the language as unique param to generate the dictionary
if (process && process.argv && process.argv.length > 2) {
    const configPath = process.argv[2];
    datasetGeneration(configPath);
}
