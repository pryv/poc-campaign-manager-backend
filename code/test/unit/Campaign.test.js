// @flow

/* global describe, it, before, after*/

import should from 'should';
import slugify from 'slugify';
import {Campaign} from '../../src/business';

describe('User', () => {

  describe('pryvAppId', () => {
    it('should slugify the title if none is provided', () => {
      const campaign: Campaign = new Campaign({
        title: 'My nice campaign',
        description: 'blop',
        permissions: []
      });

      should.exist(campaign.pryvAppId);
      campaign.pryvAppId.should.eql(slugify(campaign.title));
    });

    it('should remove the last dash if it is finishing by it', () => {
      const campaign: Campaign = new Campaign({
        title: 'abcdefghijklmnopqrstuvw xyz',
        description: 'blop',
        permission: [],
      });

      should.exist(campaign.pryvAppId);
      campaign.pryvAppId.should.eql(campaign.title.substr(0,23));
    });

});

});