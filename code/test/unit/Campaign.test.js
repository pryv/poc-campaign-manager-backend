/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

/* global describe, it*/

const should = require('should');
const slugify = require('slugify');
const {Campaign} = require('../../src/business');

describe('Campaign', () => {

  describe('pryvAppId', () => {
    it('should slugify the title if none is provided', () => {
      const campaign: Campaign = new Campaign({
        title: 'My nice campaign',
        description: 'blop',
        permissions: []
      });

      should.exist(campaign.pryvAppId);
      const appId = campaign.pryvAppId;
      appId.substring(0,3).should.eql('cm-');
      appId.length.should.eql(3 + campaign.title.length);
      (appId.substring(3,3 + campaign.title.length)).should.eql(slugify((campaign.title).toLowerCase()));
    });

  });

});