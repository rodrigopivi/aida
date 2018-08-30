import keras
import numpy as np
import src.pipelines.zebra_wings.embeddings.presaved_embeddings_initializer as pei
import src.pipelines.zebra_wings.embeddings.combine_ngrams_layer as ctg


class EmbeddingsModel:
    @staticmethod
    def setup_model(pretrained_ngram_vectors, max_words, max_ngrams, embedding_dimensions):
        model = keras.models.Sequential()
        embed = keras.layers.Embedding(
            len(pretrained_ngram_vectors),
            embedding_dimensions,
            mask_zero=True,
            input_length=max_ngrams,
            trainable=False,
            embeddings_initializer=pei.PreSavedEmbeddingsInitializer(pretrained_ngram_vectors)
        )
        model.add(keras.layers.TimeDistributed(
            embed, input_shape=(max_words, max_ngrams)))
        model.add(ctg.CombineNgramsLayer())
        return model

    def __init__(
        self,
        ngram_to_id_dictionary,
        max_words, max_ngrams,
        embedding_dimensions,
        tokenizer,
        pretrained_embedding_model=None,
        pretrained_ngram_vectors=None
    ):
        self.__ngram_to_id_dictionary = ngram_to_id_dictionary
        # self.__max_chars_per_word = max_chars_per_word
        self.__max_words = max_words
        self.__max_ngrams = max_ngrams
        self.__embedding_dimensions = embedding_dimensions
        self.__model = pretrained_embedding_model if pretrained_embedding_model != None else EmbeddingsModel.setup_model(
            pretrained_ngram_vectors, self.__max_words, self.__max_ngrams, self.__embedding_dimensions,
        )
        self.__model_input = None
        self.tokenizer = tokenizer

    def keras_model(self): return self.__model

    def model_input(self):
        if not self.__model_input:
            _input = keras.layers.Input(shape=(self.__max_words, self.__max_ngrams),)
            embedded = self.__model(_input)
            self.__model_input = keras.models.Model(inputs=_input, outputs=embedded)
        return self.__model_input


    def embed(self, sentences):
        sentences_tensor = self.sentence_to_word_ids(sentences)
        return self.model_input().predict_on_batch(sentences_tensor)

    def dictionary(self):
        return self.__ngram_to_id_dictionary

    def embed_by_word_characters(self, sentences):
        sentences_tensor = self.sentence_to_char_ids(sentences)
        return self.model_input().predict_on_batch(sentences_tensor)

    def sentence_to_char_ids(self, sentences):
        sentences_splitted_by_words = list(
            map(lambda s: self.tokenizer.split_sentence_to_words(s), sentences))
        buffer = np.zeros((len(sentences), self.__max_words, self.__max_ngrams), dtype=np.int32)
        for si, sentence in enumerate(sentences_splitted_by_words):
            for wi, word in enumerate(sentence):

                for li, letter in enumerate(list(word)):
                    if (li >= self.__max_ngrams):
                        break    
                    if letter in self.__ngram_to_id_dictionary:
                        buffer[si, wi, li] = self.__ngram_to_id_dictionary[letter]
                    else:
                        buffer[si, wi, li] = 0
        return buffer

    def sentence_to_word_ids(self, sentences):
        sentences_splitted_by_words = list(
            map(lambda s: self.tokenizer.split_sentence_to_words(s), sentences))
        buffer = np.zeros((len(sentences), self.__max_words,
                           self.__max_ngrams), dtype=np.int32)
        for si, sentence in enumerate(sentences_splitted_by_words):
            for wi, word in enumerate(sentence):
                if word in self.__ngram_to_id_dictionary:
                    buffer[si, wi, 0] = self.__ngram_to_id_dictionary[word]
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
                False if ngram not in self.__ngram_to_id_dictionary
                else vec_ids.append(self.__ngram_to_id_dictionary[ngram]) == None and True
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
