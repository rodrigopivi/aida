import keras

# given an imput composed of max_ngrams x 300d this layer will sum
# and normalize all the max_ngrams to get a unique 300d vector representation
class CombineNgramsLayer(keras.layers.Layer):
    def __init__(self, **kwargs):
        if 'input_shape' not in kwargs and 'input_dim' in kwargs:
            kwargs['input_shape'] = (kwargs.pop('input_dim'),)
        super(CombineNgramsLayer, self).__init__(**kwargs)
        self.supports_masking = True

    def call(self, ngram_sequence_identifiers):
        combined = keras.backend.sum(
            ngram_sequence_identifiers, axis=2
        )
        return keras.backend.l2_normalize(combined, axis=2)

    def compute_output_shape(self, input_shape):
        return (None, input_shape[1], input_shape[-1])
