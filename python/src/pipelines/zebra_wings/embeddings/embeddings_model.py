import keras
import numpy as np
import src.pipelines.zebra_wings.embeddings.presaved_embeddings_initializer as pei
import src.pipelines.zebra_wings.embeddings.combine_ngrams_layer as ctg


class EmbeddingsModel:
    @staticmethod
    def setup_model(dictionary, max_words, max_ngrams, embedding_dimensions):
        model = keras.models.Sequential()
        embed = keras.layers.Embedding(
            len(dictionary['PRETRAINED']),
            embedding_dimensions,
            mask_zero=True,
            input_length=max_ngrams,
            trainable=False,
            embeddings_initializer=pei.PreSavedEmbeddingsInitializer(
                dictionary['PRETRAINED'], max_words, max_ngrams, embedding_dimensions
            )
        )
        model.add(keras.layers.TimeDistributed(
            embed, input_shape=(max_words, max_ngrams)))
        model.add(ctg.CombineNgramsLayer())
        return model

    def __init__(self, dictionary, max_chars_per_word, max_words, max_ngrams, embedding_dimensions, tokenizer):
        self.__dictionary = dictionary
        self.__max_chars_per_word = max_chars_per_word
        self.__max_words = max_words
        self.__max_ngrams = max_ngrams
        self.__embedding_dimensions = embedding_dimensions
        self.__model = EmbeddingsModel.setup_model(
            self.__dictionary, self.__max_words, self.__max_ngrams, self.__embedding_dimensions,
        )
        self.tokenizer = tokenizer

    def keras_model(self): return self.__model

    def embed(self, sentences):
        _input = keras.layers.Input(
            shape=(self.__max_words, self.__max_ngrams),)
        embedded = self.__model(_input)
        entry_model = keras.models.Model(inputs=_input, outputs=embedded)
        sentences_tensor = self.sentence_to_word_ids(sentences)
        return entry_model.predict_on_batch(sentences_tensor)

    def dictionary(self):
        return self.__dictionary

    def sentences_to_character_vectors(self, sentences):
        WORDS_TO_VECTORS_MAP = self.__dictionary['PRETRAINED']
        sentences_splitted_by_words = list(
            map(lambda s: self.tokenizer.split_sentence_to_words(s), sentences))
        buffer = np.zeros((len(sentences), self.__max_words,
                           self.__max_chars_per_word * self.__embedding_dimensions), dtype=np.float32)
        for sentence_index, s in enumerate(sentences_splitted_by_words):
            for widx, w in enumerate(s):
                for lidx, letter in enumerate(list(w)):
                    if (lidx >= self.__max_chars_per_word):
                        break
                    key = letter if letter in WORDS_TO_VECTORS_MAP else self.tokenizer.UNKNOWN_NGRAM_KEY
                    vec = WORDS_TO_VECTORS_MAP[key]
                    for i, x in enumerate(vec):
                        buffer[sentence_index, widx, lidx *
                               self.__embedding_dimensions + i] = x
        return buffer

    def sentence_to_word_ids(self, sentences):
        sentences_splitted_by_words = list(
            map(lambda s: self.tokenizer.split_sentence_to_words(s), sentences))
        buffer = np.zeros((len(sentences), self.__max_words,
                           self.__max_ngrams), dtype=np.int32)
        for si, sentence in enumerate(sentences_splitted_by_words):
            for wi, word in enumerate(sentence):
                if word in self.__dictionary['WORD_TO_ID_MAP']:
                    buffer[si, wi, 0] = self.__dictionary['WORD_TO_ID_MAP'][word]
                else:
                    grams = self.generate_word_ids_from_ngrams(word)
                    for gi, gram in enumerate(grams):
                        if (gi >= self.__max_ngrams):
                            print(['Word exceeding max n grams per word: ', word])
                        else:
                            buffer[si, wi, gi] = gram
        return buffer

    def generate_word_ids_from_ngrams(self, word):
        vec_ids = []
        add_to_vecs_if_not_present = (
            lambda ngram: (
                False if ngram not in self.__dictionary['WORD_TO_ID_MAP']
                else vec_ids.append(self.__dictionary['WORD_TO_ID_MAP'][ngram]) == None and True
            )
        )
        # first try using ngrams to reconstruct the word vector
        if len(word) > 2:
            all_ngrams_found = True
            word_ngrams = self.tokenizer.split_word_to_bigrams(word)
            for wt in word_ngrams:
                if all_ngrams_found and not add_to_vecs_if_not_present(wt):
                    all_ngrams_found = False
            if all_ngrams_found:
                return vec_ids
        vec_ids = []
        # if not by ngrams use characters to construct the word vector
        # TODO: use characters to construct ngrams, not the word
        for char in list(word):
            add_to_vecs_if_not_present(char)
        return vec_ids
