#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');
const inquirer = require('inquirer');
require('dotenv').config();

const analyzeLogs = async (log, apiType) => {
  const axios = require('axios');
  const apiKey = process.env[`${apiType.toUpperCase()}_API_KEY`];
  const url = apiType === 'gemini' ? 'https://api.gemini.com/v1/analyze' : 'https://api.openai.com/v1/completions';

  try {
    const response = await axios.post(url, {
      log: log,
      api_key: apiKey,
    });
    console.log("Suggestion:", response.data.suggestion.trim());
  } catch (error) {
    console.error(`Error with ${apiType} API:`, error.message);
  }
};

const showInstructions = (apiType) => {
  const platform = os.platform();
  console.log(`\nTo use ${apiType.toUpperCase()}, you need to export your API key as an environment variable.`);
  if (platform === 'win32') {
    console.log(`For Windows, run the following command in your terminal:\n`);
    console.log(`set ${apiType.toUpperCase()}_API_KEY=your_api_key_here\n`);
  } else {
    console.log(`For Unix-based systems, run the following command in your terminal:\n`);
    console.log(`export ${apiType.toUpperCase()}_API_KEY=your_api_key_here\n`);
  }
};

inquirer
  .prompt([
    {
      type: 'list',
      name: 'apiType',
      message: 'Which API would you like to use?',
      choices: ['Gemini', 'OpenAI'],
    },
  ])
  .then((answers) => {
    const apiType = answers.apiType.toLowerCase();

    const framework = detectFramework();
    if (!framework) {
      console.error('Framework not detected. Ensure you are in the correct project directory.');
      return;
    }

    if (!process.env[`${apiType.toUpperCase()}_API_KEY`]) {
      showInstructions(apiType);
      return;
    }

    exec(runCommand(framework), (err, stdout, stderr) => {
      if (stderr) {
        console.log('Error detected, analyzing...');
        analyzeLogs(stderr, apiType);
      }
    });
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });

const detectFramework = () => {
  const fs = require('fs');
  if (fs.existsSync('angular.json')) return 'angular';
  if (fs.existsSync('vue.config.js') || fs.existsSync('src/main.js')) return 'vue';
  if (fs.existsSync('next.config.js')) return 'next';
  if (fs.existsSync('package.json')) {
    const packageJson = require('./package.json');
    if (packageJson.dependencies.react) return 'react';
  }
  return null;
};

const runCommand = (framework) => {
  switch (framework) {
    case 'react':
    case 'next':
      return 'npm run dev';
    case 'angular':
      return 'ng serve';
    case 'vue':
      return 'npm run serve';
    default:
      throw new Error('Unsupported framework');
  }
};
