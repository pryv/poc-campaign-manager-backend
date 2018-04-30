// @flow

const express = require('express');
const app: express$Application = express();
const logger: any = require('./logger');

module.exports = app;

// not sure if needed
app.options('*', (req: express$Request, res: express$Response) => {

  logger.info('OPTIONS call');

  res.header('Access-Control-Allow-Origin', '*');
  res.status(200).end();
});

app.get('/campaigns', (req: express$Request, res: express$Response) => {

  logger.info('GET /campaign');

  res.status(200)
    .header('Access-Control-Allow-Origin', '*')
    .json({
      campaigns: [
        {
          title: 'allergy exposition',
          createdBy: 'waleed',
          created: Date.now() / 1000,
          description: 'The goal of this campaign is to review the allergy exposition of patients aged 18-52 in western Switzerland.',
          permissions: [
            {
              streamId: 'allergy',
              defaultName: 'Allergy',
              level: 'read'
            }
          ]
        }
      ]
    });
});
