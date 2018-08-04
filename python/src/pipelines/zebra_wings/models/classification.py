import json
import keras
import src.utils.dictionary_utils as du
import json
from random import shuffle
import numpy as np
import math
from keras.utils import to_categorical


class ClassificationModel:
    @staticmethod
    def setup(config, dataset_params):
        intents = dataset_params["intents"]
        max_words = dataset_params["maxWordsPerSentence"]
        embedding_dimensions = config["embeddingDimensions"]
        num_filters = config['numFilters']
        filter_sizes = config['filterSizes']
        drop = config["drop"]
        num_classes = len(intents)
        LEARNING_RATE = 0.0066  # use 1e-4 as default as alternative starting point
        ADAM_BETA_1 = 0.0025
        ADAM_BETA_2 = 0.1
        optimizer = keras.optimizers.Adam(
            lr=LEARNING_RATE, beta_1=ADAM_BETA_1, beta_2=ADAM_BETA_2)
        # Layer 1: Convolution + max pool
        inputs = keras.layers.Input(
            shape=(max_words, embedding_dimensions), name="embedded_words")
        convLayer1 = keras.layers.Conv1D(
            num_filters,
            filter_sizes[0],
            input_shape=(max_words, embedding_dimensions),
            kernel_initializer='random_normal',
            padding='valid',
            activation='relu',
        )(inputs)
        maxpool1 = keras.layers.MaxPooling1D(
            pool_size=max_words - filter_sizes[0] + 1,
            padding='valid'
        )(convLayer1)
        # Layer 2: Convolution + max pool
        convLayer2 = keras.layers.Conv1D(
            num_filters,
            filter_sizes[1],
            input_shape=(max_words, embedding_dimensions),
            kernel_initializer='random_normal',
            padding='valid',
            activation='relu',
        )(inputs)
        maxpool2 = keras.layers.MaxPooling1D(
            pool_size=max_words - filter_sizes[1] + 1,
            padding='valid'
        )(convLayer2)
        # Layer 3: Convolution + max pool
        convLayer3 = keras.layers.Conv1D(
            num_filters,
            filter_sizes[2],
            input_shape=(max_words, embedding_dimensions),
            kernel_initializer='random_normal',
            padding='valid',
            activation='relu',
        )(inputs)
        maxpool3 = keras.layers.MaxPooling1D(
            pool_size=max_words - filter_sizes[2] + 1,
            padding='valid'
        )(convLayer3)
        # Concatenation of all CNN layers on different levels and apply a fully connected dense layer
        concat = keras.layers.Concatenate(axis=1)(
            [maxpool1, maxpool2, maxpool3])
        flat = keras.layers.Flatten()(concat)
        dropout = keras.layers.Dropout(drop)(flat)
        flat_pool_1 = keras.layers.Flatten()(maxpool1)
        concat_for_classification = keras.layers.Concatenate(
            axis=1)([dropout, flat_pool_1])
        outputs = keras.layers.Dense(
            num_classes,
            activation='softmax',
        )(concat_for_classification)
        model = keras.models.Model(inputs=inputs, outputs=outputs)
        model.compile(
            optimizer=optimizer,
            loss='categorical_crossentropy',
            metrics=['accuracy'],
        )
        return model

    def __init__(self, config, dataset_params, embeddings_model, logger, pretrained_model=None):
        self.__config = config
        self.__dataset_params = dataset_params
        self.__embeddings_model = embeddings_model
        if (pretrained_model != None):
            self.__model = pretrained_model
        else:
            self.__model = ClassificationModel.setup(config, dataset_params)
        self.__logger = logger

    def keras_model(self):
        return self.__model

    def predict(self, sentences):
        prediction = []
        embedded_sentences = self.__embeddings_model.embed(sentences)
        output = self.__model.predict(embedded_sentences)
        intents = self.__dataset_params['intents']
        for sidx, s in enumerate(output):
            max_intent_index = s.argmax()
            prediction.append({
                'intent': intents[max_intent_index], 'confidence': s[max_intent_index], 'sentence': sentences[sidx],
            })
        return prediction

    def train(self, train_dataset):
        train_data = du.chunks(
            train_dataset['trainX'], self.__config['batchSize'], train_dataset['trainY'])
        n_batches = math.ceil(
            len(train_dataset['trainX'])/self.__config['batchSize'])
        self.__logger(f'Start training classification model!')
        enough_accuracy_reached = False
        m = self.__model
        for idx, t_chunk in enumerate(train_data):
            if enough_accuracy_reached:
                break
            x = self.__embeddings_model.embed(t_chunk[0])
            y = to_categorical(np.array(t_chunk[1], dtype=np.int32))
            self.__logger(f'Training batch {idx+1}.')
            m.fit(
                x=x,
                y=y,
                batch_size=self.__config['batchSize'],
                shuffle=True,
                epochs=self.__config['epochs'],
                verbose=0,
                validation_split=self.__config['trainingValidationSplit'],
            )
            self.__logger(
                f'Trained {m.history.epoch[-1]+1} epochs on batch {idx + 1} of {n_batches}')
            self.__logger(
                f'Training Loss: {m.history.history["loss"][-1]} | Training Accuracy: {m.history.history["acc"][-1]}')
            self.__logger(
                f'Validation Loss: {m.history.history["val_loss"][-1]} | Validation Accuracy: {m.history.history["val_acc"][-1]}')
            self.__logger(
                '==================================================================================================')
            if (self.__config["lossThresholdToStopTraining"] > 0 and
                m.history.history["loss"][-1] < self.__config["lossThresholdToStopTraining"] and
                    m.history.history["val_loss"][-1] < self.__config["lossThresholdToStopTraining"]):
                enough_accuracy_reached = True
                self.__logger(
                    f'Enough accuracy reached! Ending training after batch {idx + 1} of {n_batches}')
                self.__logger(
                    '==================================================================================================')

    def test(self, test_examples, results_handler=None):
        chunks = du.chunks(
            test_examples['testX'], 100, test_examples['testY'])
        handler = results_handler if results_handler != None else self.__default_results_logger
        stats = {'correct': 0, 'wrong': 0, 'lowConfidence': 0}
        for t_chunk in chunks:
            x = t_chunk[0]  # sentences
            y = t_chunk[1]  # intents code per sentence
            predictions = self.predict(x)
            handler(x, y, predictions, stats)
        return stats

    def __default_results_logger(self, x, y, o, stats):
        for i, s in enumerate(x):
            intent = self.__dataset_params['intents'][y[i]]
            correct = o[i]['intent'] == intent
            if (o[i]['confidence'] < self.__config['lowConfidenceThreshold']):
                stats['lowConfidence'] += 1
                self.__logger(
                    f'LOW CONFIDENCE (intent: {o[i]["intent"]}, confidence: {o[i]["confidence"]}) - {s}')
            elif (correct):
                stats['correct'] += 1
                # self.__logger(
                #     f'CORRECT (intent: {o[i]['intent']}, confidence: {o[i]['confidence']}) - {s}')
            else:
                stats['wrong'] += 1
                self.__logger(
                    f'WRONG (intent: {o[i]["intent"]}, confidence: {o[i]["confidence"]}) - {s}')
        return stats
