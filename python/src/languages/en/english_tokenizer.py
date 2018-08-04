import re

# TODO: use fancier tokenizer, better split of words, better joining of sentences


class EnglishTokenizer:
    def __init__(self):
        # list of valid characters used for the dictionary, any word with a char that is not listed here will be skip
        self.FILTER_CHARS_REGEXP = r'[^a-z0-9\.,\?\'"!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~ ]'
        # list of charaters that act as word splitters (includes space)
        self.WORD_SEPARATORS_REGEXP = r'([\ \.\,\%\*\-\=\+\;\|\`\~])'
        # regexp that detect if a word contains non alphanumeric characters
        self.NON_ALPHANUMERIC_REGEXP = r'[^a-z0-9]'
        # when ngram is unkown, replace it with this string listed at the dictionary
        self.UNKNOWN_NGRAM_KEY = '__'
        # fastText doesn't contain numbers, so we use the sane embeddings for the number words
        self.NUMBERS_MAP = {
            "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
            "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
        }

    def sanitize_sentence(self, sentence):
        return re.sub(self.FILTER_CHARS_REGEXP, '', sentence.strip().lower())

    def split_sentence_to_words(self, sentence):
        return list(filter(lambda wrd: bool(wrd.strip()), re.split(self.WORD_SEPARATORS_REGEXP, sentence, flags=re.IGNORECASE)))

    def split_word_to_bigrams(self, word):
        ngram = 2
        grams = []
        index = len(word) - ngram + 1
        if index < 1:
            return grams
        for index in list(range(index)):
            grams.append(word[index:index+ngram])
        return grams

    def join_words_to_sentence(self, words):
        return ' '.join([str(x) for x in words])
