// @flow

/* global describe, it*/

const request = require('supertest');
const should = require('should');

const app = require('../src/app');

describe('app', () => {

  describe('campaigns', () => {

    describe('when querying campaigns', () => {

      it('should return a list of campaigns', () => {

        return request(app)
          .get('/campaigns')
          .set('Authorization', 'salut')
          .expect(200)
          .then(res => {
            res.body.should.have.property('campaigns').which.is.a.Array();
            const firstCampaign = res.body.campaigns[0];
            firstCampaign.should.be.a.Object();
            firstCampaign.should.have.property('title').which.is.a.String();
            firstCampaign.should.have.property('created').which.is.a.Number();
            firstCampaign.should.have.property('createdBy').which.is.a.String();
            firstCampaign.should.have.property('description').which.is.a.String();
            firstCampaign.should.have.property('permissions').which.is.a.Array();
          })

      });

    });

  });

});