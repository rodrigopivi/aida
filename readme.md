<p align="center">
  <a href="https://aida.dor.ai">
    <img alt="Aida" src="icon.png" width="60" />
  </a>
</p>
<h1 align="center">
  Aida
</h1>

<p align="center">
  <strong>Build simple conversational assistants, chatbots, and more.</strong><br>
  Simple deep learning language models that can train and predict from the browser, nodejs and python.
</p>

<h3 align="center">
  <a href="https://aida.dor.ai/demo">
    Demo
  </a> | 
  <a href="https://aida.dor.ai/train">
    Train an assistant
  </a> | 
  <a href="https://aida.dor.ai/overview">
    Technical overview
  </a>
</h3>

<hr />
<br/>

<div>
  <h2>Getting started</h2>

  <h3>Aida helps you prototype chatbots, fast.</h3>
  <p>
  This is an experimental library for building natural language processing models. It can help you build a simple chatbot, and simple assistants. It's like building a smart regular expression for detecting sentence intentions and extracting key entities, but its much better because it's using neural networks and pre-trained characters bigram embeddings, so it has some general language knowledge.
  </p>
  <ul>
      <li>
          <strong>It's easy to use:</strong> Getting started by creating a dataset and training couldn't be easier thanks to&nbsp;
          <a href="https://rodrigopivi.github.io/Chatito" target="_blank">
              Chatito
          </a>
          , you can create a large dataset in minutes, and start training without any setup, just from the browser.
      </li>
        <li>
          <strong>Low memory consumption:</strong> Having small file size and memory consumption is very important to be able to predict from the browser and mobile devices. The language embeddings give up some information and performance by not using a full word dictionary, instead the model uses pre-trained word character bigrams provided by
          <a href="https://fasttext.cc/" target="_blank">
              fastText
          </a>, to overcome this problem and get good predictive performance, it is required additional training examples, that is why a generative scripting language is provided to overcome this problem (Chatito DSL).
      </li>
      <li>
          <strong>Accurate:</strong> Although the model throws away some information by using bigrams to compose words instead of using full words, the models are able to get to good prediction rates given more data to learn from.
      </li>
      <li>
          <strong>Universal:</strong> The trained models should be able to run from multiple environments, that is why the
          models have two mirror implementations: in&nbsp;
          <a href="https://js.tensorflow.com/" target="_blank">
              TensorflowJS
          </a>
          &nbsp;to be able to train and run from the browser or Nodejs, and &nbsp;
          <a href="https://keras.io/" target="_blank">
              Keras
          </a> with Tensorflow backend for Python.
      </li>
      <li>
          <strong>Offline support:</strong> It should be able to train and make predictions without connectivty, no need to have a server-side api, although the trained models can also run server-side behind an api if desired. (TODO: add example running as AWS Lambda function)
      </li>
  </ul>
</div>

## [Check the demo](https://aida.dor.ai/demo)

It's a chatbott running from the browser using Tensorflow.js and using the Web Speech API for speach to text and text to speach.

## Train online

You can train from the browser [using Javascript and Tensorflow.js](https://aida.dor.ai/train) (using your local GPU resources) or from the browser [using Python and Tensorflow with Keras](https://colab.research.google.com/drive/1nzjxR7w2X99qlxjSD4pGOWksMLqK0eqZ) thanks to Google Colaboratory's free TPU's. There is no need to setup a local environment, the trained models can be saved for later use.


## Local NPM package setup

1 - Install the npm package:
```
yarn add aida-ai
```

Install the npm package:
```
yarn add aida-ai
```

2 - Create your chatito definition files, here you define your intents and your possible sentence models in mutiple `.chatito` files, and save them to a directory. e.g.: ´./chatito´

3 - Create a config file like `aida_config.json` where you define the path to your chatito definition files, the chatito dataset output path and the output path for the trained NLP models:
```
{
  "chatito": {
    "inputPath": "./chatito",
    "outputPath": "./dataset"
  },
  "aida": {
    "outputPath": "./model",
    "language": "en"
  }
}
```

  - Generate and encode the dataset for training: `npx aida-ai aida_config.json --action dataset`. The dataset will be available at the configured output path.

  - Start training: `npx aida-ai aida_config.json --action train`. The models will be saved at the configured output path.

  - Run `npx aida-ai aida_config.json --action test` for trying the generated testing dataset.

## Local setup cloning the project

Alternatively to training online and using npm package, you can setup the project locally. Clone the GH proejct and install dependencies for node and python (given NodeJS with yarn and Python3 are installed):

  - Run `yarn install` from the `./typescript` directory
  - Run `pip3 install -r requirements.txt` from the `./python` directory

## Create a dataset

Edit or create the chatito files inside `./typescript/examples/en/intents` to customize the dataset generation as you need. You can read more about [Chatito](https://rodrigopivi.github.io/Chatito).

Then, from `./typescript` directory, run `npm run dataset:en:process`. This will generate many files at the `./typescript/public/models` directory. The dataset, the dataset parameters, the testing parameters and the embeddings dictionary. (Note: Aida also supports spanish language, if you need other language you can add if you first download the fastText embeddings for that language).

## Training

Ttrain from 3 local environments:
      - For python: open `./python/main.ipynb` with jupyter notebook or jupyter lab. Python will load your custom settings generated at step 3. And save the models in a TensorflowJS compatible format at the `output` directory.

      - For web browsers: from `./typescript` run `npm run web:start`. Then navigate to `http://localhost:8000/train` for the training web UI. After training, downloading the model to the `./typescript/public/pretrained/web` directory (NOTE: this will also generate and download a new dataset).

      - For Node.js: from `./typescript` run `npm run node:start`. This will load the previously dataset generated files from `./typescript/public/models`.

## Technical Overview

Read the [technical overview documentation](https://aida.dor.ai/overview).

## Future ideas

- Add tests

- Add example that predicts from AWS Lambda

- Experiment with multi layer language models based on character features like bigrams or trigrams for transfer learning, probably using a custom BiLSTM or LSTM architecture similar but simplier to [Universal Language Model Fine-tuning for Text Classification](https://arxiv.org/abs/1801.06146) [(blog post)](http://nlp.fast.ai/classification/2018/05/15/introducting-ulmfit.html).

# Author
Rodrigo Pimentel
