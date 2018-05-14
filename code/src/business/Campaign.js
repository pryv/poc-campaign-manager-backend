// @flow

import cuid from 'cuid';

import typeof {Database} from '../database';
import {Invitation, User} from '../business';

type Permission = {
  streamId: string,
  defaultName: string,
  level: Level
} |
  {
    tag: string,
    level: Level
  };

type Level = 'read' | 'contribute' | 'manage';

export class Campaign {

  id: string;
  title: string;
  pryvAppId: string;
  description: string;
  permissions: Array<Permission>;
  created: number;
  invitationId:? string;

  constructor(params: {
    id?: string,
    title: string,
    pryvAppId: string,
    description: string,
    permissions: Array<Permission>,
    created?: number,
    invitationId?: string
  }) {
    this.id = params.id || cuid();
    this.title = params.title;
    this.pryvAppId = params.pryvAppId || this.title;
    this.description = params.description;
    this.permissions = params.permissions;
    this.created = params.created || Date.now() / 1000;
    this.invitationId = params.invitationId;
  }

  save(params: {
    db: Database,
    user: User
  }): Campaign {

    const anonymousInvitation = new Invitation({
      campaignId: this.id,
      requesterId: params.user.id,
      requesteeId: null,
      accessToken: null,
      status: 'created'
    });

    this.invitationId = anonymousInvitation.id;

    return params.db.saveCampaign({
      campaign: this,
      user: params.user,
      invitation: anonymousInvitation
    });
  }
}
