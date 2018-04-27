// @flow

const express = require('express');
const app: express$Application = express();

module.exports = app;

app.get('/campaigns', (req: express$Request, res: express$Response) => {

  res.status(200)
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
