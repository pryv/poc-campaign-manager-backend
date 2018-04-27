const express = require('express');
const app: any = express();

module.exports = app;

app.get('/', (req: any, res: any) => {

  res.status(200)
    .json({
      content: 'OK'
    });
});
