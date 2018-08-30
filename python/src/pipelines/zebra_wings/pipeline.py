import keras
import numpy as np
import src.languages.en.english_tokenizer as eng
import src.languages.es.spanish_tokenizer as spa
import src.pipelines.zebra_wings.models.classification as cm
import src.pipelines.zebra_wings.models.ner as nm
import src.pipelines.zebra_wings.embeddings.embeddings_model as em


def get_tokenizer(language):
    if (language.lower() == 'en'):
        return eng.EnglishTokenizer()
    elif (language.lower() == 'es'):
        return spa.SpanishTokenizer()
    raise ValueError('Unkown language')


default_pipeline_definition = {
    'config': {
        'classification': {
            'epochs': 5,
            'filterSizes': [2, 4, 8],
            'lowConfidenceThreshold': 0.3,
            'numFilters': 128,
        },
        'default': {
            'batchSize': 70,
            'drop': 0.5,
            'embeddingDimensions': 300,
            'lossThresholdToStopTraining': 0,
            'maxNgrams': 25,
            'trainingValidationSplit': 0.3,
        },
        'ner': {
            'epochs': 5,
            'lowConfidenceThreshold': 0.2,
            'numFilters': [128, 128],
        },
    },
}


class AidaPipeline:
    def __init__(
        self,
        dataset_params,
        logger,
        ngram_to_id_dictionary,
        pretrained_classifier=None,
        pretrained_ner=None,
        pretrained_embedding=None,
        pretrained_ngram_vectors=None,
        pipeline_definition=default_pipeline_definition,
    ):
        self.__embeddings_model = None
        self.__dataset_params = dataset_params
        self.__logger = logger
        self.__pipeline_definition = pipeline_definition
        self.__classification_model = pretrained_classifier
        self.__ner_model = pretrained_ner
        self.__tokenizer = get_tokenizer(self.__dataset_params['language'])
        self.__embeddings_model = em.EmbeddingsModel(
            ngram_to_id_dictionary,
            dataset_params['maxWordsPerSentence'],
            pipeline_definition['config']['default']['maxNgrams'],
            pipeline_definition['config']['default']['embeddingDimensions'],
            self.__tokenizer,
            pretrained_embedding,
            pretrained_ngram_vectors,
        )
        classification_cfg = dict()
        classification_cfg.update(pipeline_definition['config']['default'])
        classification_cfg.update(
            pipeline_definition['config']['classification'])
        self.__classification_model = cm.ClassificationModel(
            classification_cfg,
            dataset_params,
            self.__embeddings_model,
            logger,
            pretrained_classifier,
        )
        ner_cfg = dict()
        ner_cfg.update(pipeline_definition['config']['default'])
        ner_cfg.update(pipeline_definition['config']['ner'])
        self.__ner_model = nm.NerModel(
            ner_cfg,
            dataset_params,
            self.__embeddings_model,
            logger,
            pretrained_ner,
        )

    def models(self):
        return {'classification': self.__classification_model, 'ner': self.__ner_model, 'embedding': self.__embeddings_model}

    def train(self, train_dataset):
        self.__classification_model.train(train_dataset)
        self.__ner_model.train(train_dataset)

    def test(self, test_dataset):
        classification_stats = self.__classification_model.test(test_dataset)
        ner_stats = self.__ner_model.test(test_dataset)
        return {'classificationStats': classification_stats, 'nerStats': ner_stats}

    def predict(self, sentences):
        classification = self.__classification_model.predict(sentences)
        ner = self.__ner_model.predict(sentences, classification)
        return {'classification': classification, 'ner': ner}

    def save(self, cfg):
        self.__classification_model.keras_model().save(
            cfg['classificationPath'])
        self.__ner_model.keras_model().save(cfg['nerPath'])
        self.__embeddings_model.keras_model().save(cfg['embeddingPath'])
