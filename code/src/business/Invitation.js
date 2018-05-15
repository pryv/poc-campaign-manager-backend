// @flow

import cuid from 'cuid';

import typeof {Database} from '../database';
import typeof {User} from '../business';

export type InvitationStatus = 'created' | 'seen' | 'accepted' | 'cancelled' | 'refused';

export class Invitation {

  id: string;
  campaignId: string;
  requesterId: string;
  requesteePryvUsername:? string;
  requesteeId:? string;
  accessToken: string;
  status: InvitationStatus;
  created: number;
  modified: number;

  constructor(params: {
    id?: string,
    campaignId: string,
    requesterId: string,
    requesteePryvUsername?: string,
    requesteeId?: string,
    accessToken?: string,
    status?: InvitationStatus,
    created?: number,
    modified?: number,
  }) {
    const defaultTime = Date.now() / 1000;

    this.id = params.id || cuid();
    this.campaignId = params.campaignId;
    this.requesterId = params.requesterId;
    this.requesteePryvUsername = params.requesteePryvUsername || null;
    this.requesteeId = params.requesteeId || null;
    this.accessToken = params.accessToken || null;
    this.status = params.status || 'created';
    this.created = params.created || defaultTime;
    this.modified = params.modified || this.created;
  }

  save(params: {
    db: Database,
    user: User
  }): void {
    params.db.saveInvitation({invitation: this});
  }
}