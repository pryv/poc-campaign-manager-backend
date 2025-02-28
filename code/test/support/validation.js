/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
// @flow

const {User, Campaign, Invitation, Access} = require('../../src/business');

const should = require('should');

function checkInvitations(expected: Invitation, actual: Invitation, omit: mixed): void {
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

function checkUsers(expected: User, actual: User, omit: mixed): void {

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
  if (expected.localId && (omit.localId != true))
    expected.localId.should.eql(actual.localId);
}

function checkCampaigns(expected: Campaign, actual: Campaign, omit?: Object): void {
  if (omit == null)
    omit = {};

  should.exist(actual);

  if (expected.id && (! omit.id))
    expected.id.should.eql(actual.id);

  expected.title.should.eql(actual.title);
  expected.pryvAppId.should.eql(actual.pryvAppId);
  expected.description.should.eql(actual.description);
  expected.permissions.should.eql(actual.permissions);
  expected.created.should.approximately(actual.created, 1.0);

}

function checkAccesses(expected: Access, actual: Access): void {
  expected.id.should.eql(actual.id);
  expected.created.should.eql(actual.created);
  expected.isValidUntil.should.eql(actual.isValidUntil);
}

module.exports = {
  checkInvitations: checkInvitations,
  checkUsers: checkUsers,
  checkCampaigns: checkCampaigns,
  checkAccesses: checkAccesses,
};