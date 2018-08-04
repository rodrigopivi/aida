import re

# TODO: use fancier tokenizer, better split of words, better joining of sentences


class SpanishTokenizer:
    def __init__(self):
        # list of valid characters used for the dictionary, any word with a char that is not listed here will be skip
        self.FILTER_CHARS_REGEXP = r'[^aábcdeéfghijklmnñoópqrstuúüvwxyzAÁBCDEÉFGHIJKLMNÑOÓPQRSTUÚÜVWXYZ 0-9\.,\?\'"!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]'
        # list of charaters that act as word splitters (includes space)
        self.WORD_SEPARATORS_REGEXP = r'([\ \.\,\%\*\-\=\+\;\|\`\~])'
        # regexp that detect if a word contains non alphanumeric characters
        self.NON_ALPHANUMERIC_REGEXP = r'[^aábcdeéfghijklmnñoópqrstuúüvwxyzAÁBCDEÉFGHIJKLMNÑOÓPQRSTUÚÜVWXYZ0-9]'
        # when ngram is unkown, replace it with this string listed at the dictionary
        self.UNKNOWN_NGRAM_KEY = '__'
        # fastText doesn't contain numbers, so we use the sane embeddings for the number words
        self.NUMBERS_MAP = {
            'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
            'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9',
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
