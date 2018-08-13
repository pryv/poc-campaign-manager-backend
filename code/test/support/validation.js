// @flow

import {User, Campaign, Invitation, Access} from '../../src/business';

import should from 'should';

const slugify = require('slugify');

export function checkInvitations(expected: Invitation, actual: Invitation, omit: mixed): void {
  if (omit == null)
    omit = {};

  should.exist(actual);

  if (expected.id && (! omit.id))
    expected.id.should.eql(actual.id);
  if (expected.accessToken)
    expected.accessToken.should.eql(actual.accessToken);
  if (expected.status)
    expected.status.should.eql(actual.status);
  if (expected.created)
    expected.created.should.eql(actual.created);
  if (expected.modified && (! omit.modified))
    expected.modified.should.eql(actual.modified);

  checkCampaigns(expected.campaign, actual.campaign);

  checkUsers(expected.requester, actual.requester);
  checkUsers(expected.requestee, actual.requestee);
}

export function checkUsers(expected: User, actual: User, omit: mixed): void {

  if (omit == null) {
    omit = {};
  }

  should.exist(actual);

  if (expected.id && (omit.id != true))
    expected.id.should.eql(actual.id);
  if (expected.username)
    expected.username.should.eql(actual.username);
  if (expected.pryvId)
    expected.pryvId.should.eql(actual.pryvId);
  if (expected.pryvUsername)
    expected.pryvUsername.should.eql(actual.pryvUsername);
  if (expected.localId)
    expected.localId.should.eql(actual.localId);
}

export function checkCampaigns(expected: Campaign, actual: Campaign, omit?: Object): void {
  if (omit == null)
    omit = {};

  should.exist(actual);

  if (expected.id && (! omit.id))
    expected.id.should.eql(actual.id);

  expected.title.should.eql(actual.title);
  (expected.pryvAppId.substring(3, slugify(actual.title).length + 3)).should.eql(slugify(actual.title));
  expected.description.should.eql(actual.description);
  expected.permissions.should.eql(actual.permissions);
  expected.created.should.approximately(actual.created, 1.0);

}

export function checkAccesses(expected: Access, actual: Access): void {
  expected.id.should.eql(actual.id);
  expected.created.should.eql(actual.created);
  expected.isValidUntil.should.eql(actual.isValidUntil);
}