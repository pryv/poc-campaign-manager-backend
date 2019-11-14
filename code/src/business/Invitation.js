// @flow

import type {Database} from '../database';

const cuid = require('cuid');

const Campaign = require('./Campaign');
const User = require('./User');

/**
 * created: when the invitation has been created - only for targeted
 * seen: when the invitation has been opened - only for targeted
 * accepted: when the invitation has been accepted by the requestee
 * refused: when the invitation has been refused by the requestee
 * cancelled: when the campaign has been stopped by the requester -> can not be accepted anymore
 * hold: when the invitation has been accepted, then revoked -> can be accepted again
 */
export type InvitationStatus = 'created' | 'seen' | 'accepted' | 'cancelled' | 'refused' | 'hold';

class Invitation {

  id: string;
  campaign: Campaign;
  requester: User;
  requestee: User;
  accessToken: ?string;
  status: InvitationStatus;
  created: number;
  modified: number;
  headId: ?string; // for versioned invitations

  constructor(params: {
    id?: string,
    campaign: Campaign,
    requester: User,
    requestee: User,
    accessToken?: string,
    status?: InvitationStatus,
    created?: number,
    modified?: number,
    headId?: string,
  }) {
    const defaultTime = Date.now() / 1000;

    this.id = params.id || cuid();
    this.campaign = new Campaign(params.campaign);
    this.requester = new User(params.requester);
    this.requestee = new User(params.requestee);
    this.accessToken = params.accessToken || null;
    this.status = params.status || 'created';
    this.created = params.created || defaultTime;
    this.modified = params.modified || this.created;
    this.headId = params.headId || null;
  }

  update(params: {
    db: Database,
    update: Invitation
  }): Invitation {
    if (params.update.accessToken)
      this.accessToken = params.update.accessToken;
    if (params.update.status)
      this.status = params.update.status;
    this.modified = Date.now() / 1000;
    return params.db.invitations.updateOne({ invitation: this });
  }

  save(params: {
    db: Database,
  }): void {
    params.db.invitations.save({invitation: this});
  }
}
module.exports = Invitation;