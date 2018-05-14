// @flow

import typeof {Database} from '../database';
import cuid from 'cuid';

export type InvitationStatus = 'created' | 'seen' | 'accepted' | 'cancelled' | 'refused';

export class Invitation {

  id: string;
  campaignId: string;
  requesterId: string;
  requesteeId:? string;
  accessToken: string;
  status: InvitationStatus;
  created: number;
  modified: number;

  constructor(params: {
    id?: string,
    campaignId: string,
    requesterId: string,
    requesteeId?: string,
    accessToken?: string,
    status?: InvitationStatus,
    created?: number,
    modified?: number
  }) {
    const defaultTime = Date.now() / 1000;

    this.id = params.id || cuid();
    this.campaignId = params.campaignId;
    this.requesterId = params.requesterId;
    this.requesteeId = params.requesteeId;
    this.accessToken = params.accessToken;
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