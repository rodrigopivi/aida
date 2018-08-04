import keras
import numpy as np


class PreSavedEmbeddingsInitializer(keras.initializers.Initializer):
    def __init__(self, dictionary, max_words, max_ngrams, embedding_dimensions):
        self.config = {
            "dictionary": dictionary,
            "max_words": max_words,
            "max_ngrams": max_ngrams,
            "embedding_dimensions": embedding_dimensions,
        }

    def __call__(self, shape, dtype=None):
        encoded_sentences = list(self.config["dictionary"].values())
        return np.array(encoded_sentences, dtype)

    def get_config(self):
        return self.config["dictionary"]
