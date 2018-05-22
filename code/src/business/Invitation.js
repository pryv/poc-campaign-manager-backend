// @flow

import cuid from 'cuid';

import typeof {Database} from '../database';
import {User, Campaign} from '../business';

/**
 * created: when the invitation has been created - only for targeted
 * seen: when the invitation has been opened - only for targeted
 * accepted: when the invitation has been accepted by the requestee
 * refused: when the invitation has been refused by the requestee
 * cancelled: when the invitation has been stopped by the requester -> can not be accepted anymore
 * hold: when the invitation has been accepter, then revoked -> can be accepted again
 */
export type InvitationStatus = 'created' | 'seen' | 'accepted' | 'cancelled' | 'refused' | 'hold';

export class Invitation {

  id: string;
  campaign: Campaign;
  requester: User;
  requestee: User;
  accessToken: string;
  status: InvitationStatus;
  created: number;
  modified: number;

  constructor(params: {
    id?: string,
    campaign: Campaign,
    requester: User,
    requestee: User,
    accessToken?: string,
    status?: InvitationStatus,
    created?: number,
    modified?: number,
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
  }

  save(params: {
    db: Database,
  }): void {
    params.db.saveInvitation({invitation: this});
  }
}