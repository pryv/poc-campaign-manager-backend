// @flow

import {User, Campaign, Invitation} from '../../src/business';

import should from 'should';


export function checkInvitations(expected: Invitation, actual: Invitation, omit: mixed): void {
  if (omit == null)
    omit = {};

  should.exist(actual);

  if (expected.id)
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

export function checkUsers(expected: User, actual: User): void {

  should.exist(actual);

  if (expected.id)
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

export function checkCampaigns(expected: Campaign, actual: Campaign): void {
  should.exist(actual);

  expected.id.should.eql(actual.id);
  expected.title.should.eql(actual.title);
  expected.pryvAppId.should.eql(actual.pryvAppId);
  expected.description.should.eql(actual.description);
  expected.permissions.should.eql(actual.permissions);
  expected.created.should.eql(actual.created);
}