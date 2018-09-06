import json
import keras
import src.utils.dictionary_utils as du
import json
from random import shuffle
import numpy as np
import math
from keras.utils import to_categorical
from src.pipelines.zebra_wings.time_series_attention import TimeSeriesAttention

class NerModel:
    @staticmethod
    def setup(config, dataset_params):
        max_words = dataset_params["maxWordsPerSentence"]
        drop = config["drop"]
        embedding_dimensions = config["embeddingDimensions"]
        num_filters = config["numFilters"]
        add_attention = config["addAttention"]
        num_slot_types = len(dataset_params["slotsToId"].keys())
        LEARNING_RATE = 0.0066  # use 1e-4 as default as alternative starting point
        ADAM_BETA_1 = 0.0025
        ADAM_BETA_2 = 0.1
        optimizer = keras.optimizers.Adam(lr=LEARNING_RATE, beta_1=ADAM_BETA_1, beta_2=ADAM_BETA_2)
        # WORD LEVEL EMBEDDINGS
        embedded_sentences_input = keras.layers.Input(
            shape=(max_words, embedding_dimensions), name="embedded_words")
        conv_layer_1 = keras.layers.Conv1D(
            num_filters[0],
            1,
            input_shape=(max_words, embedding_dimensions),
            kernel_initializer='random_normal',
            padding='valid',
            activation='relu',
        )(embedded_sentences_input)
        conv_layer_2 = keras.layers.Conv1D(
            num_filters[0],
            1,
            kernel_initializer='random_normal', # Xavier initialization for tanh, random_normal for relu
            padding='valid',
            activation='tanh', # NOTE: tanh at this layer consistently increases performance
        )(conv_layer_1)
        # CHARACTER LEVEL EMBEDDINGS
        embedded_characters_input = keras.layers.Input(
            shape=(max_words, embedding_dimensions), name="embedded_word_characters")
        conv_c_layer_1 = keras.layers.Conv1D(
            num_filters[1],
            1,
            kernel_initializer='random_normal',
            padding='valid',
            activation='relu',
        )(embedded_characters_input)
        dropout_c1 = keras.layers.Dropout(drop)(conv_c_layer_1)
        conv_c_layer_2 = keras.layers.Conv1D(
            num_filters[1],
            1,
            kernel_initializer='random_normal',
            padding='valid',
            activation='relu',
        )(dropout_c1)
        # CONCATENATE BOTH CNN ENCODERS (WORD AND CHAR) WITH THE INPUT AND THE CHAR CNN LAYER 1
        class_label_input = keras.layers.Input(shape=(len(dataset_params['intents']),), name="embedded_intent")
        class_label_repeated = keras.layers.RepeatVector(max_words)(class_label_input)
        # NOTE: Adding masking when attention is activatted increases performance
        if add_attention:
            sentetnces_mask = keras.layers.Masking(mask_value=0.0)(embedded_sentences_input)
            conv_layer2_mask = keras.layers.Masking(mask_value=0.0)(conv_layer_2)
            conv_c_layer2_mask = keras.layers.Masking(mask_value=0.0)(conv_c_layer_2)
            concated = keras.layers.Concatenate()([
                class_label_repeated, sentetnces_mask, conv_layer2_mask, conv_c_layer2_mask,
            ])
        else:
            concated = keras.layers.Concatenate()([
                class_label_repeated, embedded_sentences_input, conv_layer_2, conv_c_layer_2,
            ])
        lstm = keras.layers.LSTM(max_words, return_sequences=True)
        bi_lstm = keras.layers.Bidirectional(lstm, merge_mode='concat', name='bidi_encoder')(concated)
        if add_attention:
            time_attention = TimeSeriesAttention(name='attention_weight')(bi_lstm)
            final_hidden = keras.layers.Concatenate()([ bi_lstm, time_attention ])
        else:
            final_hidden = bi_lstm
        outputs = keras.layers.Dense(num_slot_types, activation='softmax')(final_hidden)
        model = keras.models.Model(
            inputs=[class_label_input, embedded_sentences_input, embedded_characters_input],
            outputs=outputs,
        )
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
            self.__model = NerModel.setup(config, dataset_params)
        self.__logger = logger

    def keras_model(self):
        return self.__model

    def raw_prediction(self, sentences, classification_pred):
        intents = self.__dataset_params['intents']
        embedded_sentences = self.__embeddings_model.embed(sentences)
        embedded_characters = self.__embeddings_model.embed_by_word_characters(sentences)
        class_label = []
        for p in classification_pred:
            intent_encoded = np.zeros(len(intents))
            idx = -1
            try:
                idx = intents.index(p['intent'])
            except ValueError:
                idx = -1
            if idx != -1:
                intent_encoded[idx] = 1
            class_label.append(intent_encoded)
        intent_labels = np.array(class_label)
        output = self.__model.predict([
            intent_labels, embedded_sentences, embedded_characters,
        ])
        ret_predictions = []
        for sentence_preds in output:
            sentence_word_predictions = []
            for idx, word_tag_preds in enumerate(sentence_preds):
                highest_index = word_tag_preds.argmax()
                confidence = word_tag_preds[highest_index]
                sentence_word_predictions.append({
                    "highestIndex": highest_index,
                    "confidence": confidence,
                })
            ret_predictions.append(sentence_word_predictions)
        return ret_predictions

    def predict(self, sentences, classification_pred):
        prediction = []
        low_confidence_threshold = self.__config['lowConfidenceThreshold']
        slots_to_id = self.__dataset_params['slotsToId']
        word_predictions_chunk = self.raw_prediction(
            sentences, classification_pred)
        for i, s in enumerate(sentences):
            sentence_word_prediction_ids = word_predictions_chunk[i]
            sentence_words = self.__embeddings_model.tokenizer.split_sentence_to_words(
                s)
            accumulator = {
                'current': {'key': '', 'value': '', 'confidence': 0},
                'slots': {},
                'sentence': sentences[i]
            }
            for wpidx, w in enumerate(sentence_words):
                wp = sentence_word_prediction_ids[wpidx]
                current_slot_key = None
                for _id, slot in enumerate(slots_to_id.keys()):
                    if (current_slot_key != None):
                        break
                    if _id == wp['highestIndex']:
                        current_slot_key = slot
                if (accumulator['current']['confidence'] == 0):
                    accumulator['current']['confidence'] = wp['confidence']
                if (accumulator['current']['key'] == current_slot_key):
                    accumulator['current']['value'] += ' ' + w
                    confidence_avg = (
                        (wp['confidence'] + accumulator['current']['confidence'])/2)
                    accumulator['current']['confidence'] = confidence_avg
                else:
                    if (accumulator['current']['key'] != '' and
                        accumulator['current']['key'] != 'O' and
                            wp['confidence'] >= low_confidence_threshold):
                        new_slot = {
                            'confidence': wp['confidence'], 'value': accumulator['current']['value']}
                        if accumulator['current']['key'] in accumulator['slots']:
                            accumulator['slots'][accumulator['current']['key']].append(
                                new_slot)
                        else:
                            accumulator['slots'][accumulator['current']['key']] = [
                                new_slot]
                    accumulator['current'] = {
                        'key': current_slot_key, 'value': w, 'confidence': wp['confidence'],
                    }
                if (wpidx + 1 == len(sentence_word_prediction_ids)):
                    if (accumulator['current']['key'] != 'O' and wp['confidence'] >= low_confidence_threshold):
                        new_slot = {
                            'confidence': wp['confidence'], 'value': accumulator['current']['value']}
                        if accumulator['current']['key'] in accumulator['slots']:
                            accumulator['slots'][accumulator['current']['key']].append(
                                new_slot)
                        else:
                            accumulator['slots'][accumulator['current']['key']] = [
                                new_slot]
            prediction.append({
                'sentence': accumulator['sentence'],
                'slots': accumulator['slots'],
            })
        return prediction

    def train(self, train_dataset):
        chunks = du.chunks(
            train_dataset['trainX'],
            self.__config['batchSize'],
            train_dataset['trainY'],
            train_dataset['trainY2'])
        self.__logger(f'Start training NER model! (attention enabled: {self.__config["addAttention"]})')
        enough_accuracy_reached = False
        m = self.__model
        num_slot_types = len(self.__dataset_params["slotsToId"].keys())
        n_batches = math.ceil(
            len(train_dataset['trainX'])/self.__config['batchSize'])
        for idx, t_chunk in enumerate(chunks):
            train_x_chunks = t_chunk[0]  # sentences
            train_y_chunks = t_chunk[1]  # intents code per sentence
            train_y2_chunks = t_chunk[2]  # slots encoded per sentence word
            if enough_accuracy_reached:
                break
            intent_labels = to_categorical(np.array(
                train_y_chunks, dtype=np.int32), len(self.__dataset_params['intents']))
            embedded_sentence_words = self.__embeddings_model.embed(
                train_x_chunks)
            embedded_sentence_word_chars = self.__embeddings_model.embed_by_word_characters(train_x_chunks)
            y2_sentences = []
            for words_slot_id in train_y2_chunks:
                slot_ids = np.array(words_slot_id, dtype=np.int32)
                pad_width = self.__dataset_params['maxWordsPerSentence'] - len(
                    words_slot_id)
                padded_slot_ids = np.pad(
                    slot_ids, [[0, pad_width]], mode='constant'
                )
                y2_sentences.append(to_categorical(padded_slot_ids, num_slot_types))
            slot_tags = np.stack(y2_sentences)
            m.fit(
                x=[intent_labels, embedded_sentence_words, embedded_sentence_word_chars],
                y=slot_tags,
                shuffle=True,
                # batch_size=self.__config['batchSize'], # IMPORTANT: adding batch size here makes the optimization bad
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
        handler = results_handler if results_handler != None else self.__default_results_logger
        chunks = du.chunks(
            test_examples['testX'],
            self.__config['batchSize'],
            test_examples['testY'],
            test_examples['testY2'])
        stats = {'correct': 0, 'wrong': 0}
        for t_chunk in chunks:
            test_x = t_chunk[0]  # sentences
            test_y = t_chunk[1]  # intents code per sentence
            test_y2 = t_chunk[2]  # slots encoded per sentence word
            p_intent = [{
                'confidence': 1,
                'intent': self.__dataset_params['intents'][test_y[sentence_id]],
                'sentence': sentence,
            } for sentence_id, sentence in enumerate(test_x)]
            predictions = self.raw_prediction(test_x, p_intent)
            preds = []
            for sentences in predictions:
                preds.append([sentence['highestIndex']
                              for sentence in sentences])
            handler(test_x, test_y2, preds, stats)
        return stats

    def __default_results_logger(self, x, y2, o, stats):
        for sentence_idx, s in enumerate(x):
            expected_tags = y2[sentence_idx]
            predicted_tags = o[sentence_idx]
            correct = True
            for idx, tag in enumerate(expected_tags):
                if (predicted_tags[idx] != tag and correct):
                    correct = False
            if (correct):
                stats['correct'] += 1
                # self.__logger(f'CORRECT - {s} expected: {expected_tags}, predicted: {predicted_tags})')
            else:
                stats['wrong'] += 1
                self.__logger(
                    f'WRONG - {s} expected: {expected_tags}, predicted: {predicted_tags})'
                )
        return stats
