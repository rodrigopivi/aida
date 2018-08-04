import { IAidaTokenizer } from '../../types';

// TODO: use fancier tokenizer, better split of words, better joining of sentences
class SpanishTokenizer implements IAidaTokenizer {
    // list of valid characters used for the dictionary, any word with a char that is not listed here will be skip
    public FILTER_CHARS_REGEXP = /[^aábcdeéfghijklmnñoópqrstuúüvwxyzAÁBCDEÉFGHIJKLMNÑOÓPQRSTUÚÜVWXYZ 0-9\.,\?\'"!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]/g;
    // list of charaters that act as word splitters (includes space)
    public WORD_SEPARATORS_REGEXP = /([\ \.\,\%\*\-\=\+\;\|\`\~])/g;
    // regexp that detect if a word contains non alphanumeric characters
    public NON_ALPHANUMERIC_REGEXP = /[^aábcdeéfghijklmnñoópqrstuúüvwxyzAÁBCDEÉFGHIJKLMNÑOÓPQRSTUÚÜVWXYZ0-9]/g;
    // when ngram is unkown, replace it with this string listed at the dictionary
    public UNKNOWN_NGRAM_KEY = '__';
    // fastText doesn't contain numbers, so we use the sane embeddings for the number words
    public NUMBERS_MAP: { [key: string]: string } = {
        // tslint:disable:object-literal-sort-keys
        cero: '0',
        uno: '1',
        dos: '2',
        tres: '3',
        cuatro: '4',
        cinco: '5',
        seis: '6',
        siete: '7',
        ocho: '8',
        nueve: '9'
        // tslint:enable:object-literal-sort-keys
    };

    public sanitizeSentence = (sentence: string): string => {
        return sentence
            .trim()
            .toLowerCase()
            .replace(this.FILTER_CHARS_REGEXP, '');
    };

    public splitSentenceToWords = (sentence: string): string[] => {
        return this.sanitizeSentence(sentence)
            .split(this.WORD_SEPARATORS_REGEXP)
            .map(w => w.trim())
            .filter(w => !!w);
    };

    public splitWordToBiGrams = (word: string): string[] => {
        const ngram = 3;
        const grams: string[] = [];
        let index = word.length - ngram + 1;
        if (index < 1) {
            return grams;
        }
        while (index--) {
            grams[index] = word.substr(index, ngram);
        }
        return grams;
    };

    public joinWordsToSentence = (words: string[]): string => words.join(' ');
}

export default new SpanishTokenizer();
