import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import englishTokenizer from '../languages/en/EnglishTokenizer';
import spanishTokenizer from '../languages/es/SpanishTokenizer';

function getTokenizerAndVectors(language: 'en' | 'es') {
    const lang = language ? language.toLowerCase() : language;
    if (lang === 'en') {
        return {
            fastTextVectorsFile: path.resolve(__dirname, '../languages/en/fastText.en.vec'),
            outputDictionary: path.resolve(__dirname, '../languages/en/dict.json'),
            outputDictionaryExtension: path.resolve(__dirname, '../languages/en/dict.trigrams.json'),
            tokenizer: englishTokenizer
        };
    } else if (lang === 'es') {
        return {
            fastTextVectorsFile: path.resolve(__dirname, '../languages/es/fastText.es.vec'),
            outputDictionary: path.resolve(__dirname, '../languages/es/dict.json'),
            outputDictionaryExtension: path.resolve(__dirname, '../languages/es/dict.trigrams.json'),
            tokenizer: spanishTokenizer
        };
    }
    throw new Error("Invalid config language. Only 'en' and 'es' are supported.");
}

const createDictionaryFromFastText = (language: 'en' | 'es') => {
    if (!language) {
        throw new Error("Invalid Config. 'config.embeddings.fastTextFile' must be provided to generate dictionary.");
    }
    const { fastTextVectorsFile, tokenizer, outputDictionary, outputDictionaryExtension } = getTokenizerAndVectors(language);
    // tslint:disable:no-console
    console.log(
        'Generating dictioanry with this language options: ',
        JSON.stringify({ fastTextVectorsFile, outputDictionary, outputDictionaryExtension }, null, 2)
    );
    // tslint:enable:no-console
    const lineReader = readline.createInterface({
        input: fs.createReadStream(fastTextVectorsFile)
    });
    /* This module is used to create a custom json dictionary of pretrained fasttext characters and bigrams
     * we remove all the unwanted stuff, to go from a 6gb dictionary to some megabytes. This utility
     * requires the pretrained fasttext 300 dimensions vectors already downloaded from https://fasttext.cc/
     *
     * The dictionary is composed of:
     *   - the index 0 is the empty mask using "__" keyword, that maps to 300d zeros
     *   - one letter characters (only valid ascii characters defined at tokenizer.FILTER_CHARS_REGEXP)
     *   - bigrams (ngrams of 2 characters, with only valid alphanumeric chars filtered by the tokenizer)
     */
    const dictionary = new Map() as Map<string, number[]>;
    const dictionaryExtension = new Map() as Map<string, number[]>; // extend dictionary with trigrams
    // NOTE: accept all ascii characters for keywords of 1 char, but only alphanumerics for bigrams
    lineReader.on('line', (line: string) => {
        const spaceSepValues = line.trim().split(' ');
        const values = spaceSepValues.slice(1).map(n => parseFloat(n));
        const keyword = spaceSepValues[0].toLowerCase();
        const containsNonAsciiCharacters = keyword.match(tokenizer.FILTER_CHARS_REGEXP) ? true : false;
        if (containsNonAsciiCharacters) {
            return;
        }
        // NOTE: the first line does not contain the 300d values, so its length is special
        if (spaceSepValues.length === 2) {
            dictionary.set(tokenizer.UNKNOWN_NGRAM_KEY, new Array(300).fill(0));
            // tslint:disable-next-line:no-console
            return console.log('Words / Dimensions: ', spaceSepValues.join(' / '), 'Please wait, this may take a while...');
        }
        const nonAlphanumericChars = keyword.match(tokenizer.NON_ALPHANUMERIC_REGEXP) ? true : false;
        // NOTE: fastText does not come with number embeddings by symbol but it comes with numbers by words
        //       so here numbers are added by symbol and word from the dictionary
        if (tokenizer.NUMBERS_MAP[keyword] !== undefined && dictionary.get(keyword) === undefined) {
            dictionary.set(keyword, values);
            dictionary.set(tokenizer.NUMBERS_MAP[keyword], values);
            return;
        }
        if (keyword.length === 3) {
            if (nonAlphanumericChars) {
                return;
            }
            if (dictionaryExtension.get(keyword)) {
                return;
            }
            dictionaryExtension.set(keyword, values);
            // create an extra dictionary of only trigrams
        } else if (keyword.length <= 2) {
            // onle use bigrams and 1 character embeddings for the main dictionary
            if (keyword.length > 1 && nonAlphanumericChars) {
                return;
            }
            if (dictionary.get(keyword)) {
                return;
            }
            dictionary.set(keyword, values);
        }
    });

    lineReader.on('close', () => {
        fs.writeFile(outputDictionary, JSON.stringify([...dictionary]), (err: any) => {
            // tslint:disable:no-console
            if (err) {
                console.error(err);
                return;
            }
            fs.writeFile(outputDictionaryExtension, JSON.stringify([...dictionaryExtension]), (err2: any) => {
                err2 ? console.error(err2) : console.log('Done with dictionary and trigrams dictionary extension.');
            });
            // tslint:enable:no-console
        });
    });
};

// This script is intended to be used from the command line passing the language as unique param to generate the dictionary
if (process && process.argv && process.argv.length > 2) {
    const lang = process.argv[2];
    if (lang === 'en' || lang === 'es') {
        createDictionaryFromFastText(lang);
    } else {
        // tslint:disable:no-console
        console.error('ERROR: Unknown language:', lang);
        // tslint:enable:no-console
        process.exit(1);
    }
}
