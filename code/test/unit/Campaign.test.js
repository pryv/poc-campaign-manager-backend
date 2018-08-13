// @flow

/* global describe, it, before, after*/

import should from 'should';
import slugify from 'slugify';
import {Campaign} from '../../src/business';

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
      (appId.substring(3,3 + campaign.title.length)).should.eql(slugify(campaign.title));
    });

  });

});