import keras
import numpy as np

class PreSavedEmbeddingsInitializer(keras.initializers.Initializer):
    def __init__(self, pretrained_ngram_vectors=None):
        self.config = { "pretrained_ngram_vectors": pretrained_ngram_vectors }

    def __call__(self, shape, dtype=None):
        if not self.config["pretrained_ngram_vectors"]:
            return keras.constant(0, shape=shape, dtype=dtype)
        else:
            #  pretrained_ngram_vectors is like [['__', [0, ... ]]], so we only extract the vectors with index order
            encoded_sentences = [x[1] for x in self.config["pretrained_ngram_vectors"]]
            return np.array(encoded_sentences, dtype)

    def get_config(self):
        return self.config["pretrained_ngram_vectors"]
