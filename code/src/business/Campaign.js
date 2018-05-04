// @flow

import typeof {Database} from '../database';
import cuid from 'cuid';

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
  created: ?number;

  constructor(params: {
    id?: string,
    title: string,
    pryvAppId: string,
    description: string,
    permissions: Array<Permission>,
    created?: number
  }) {
    this.id = params.id || cuid();
    this.title = params.title;
    this.pryvAppId = params.pryvAppId;
    this.description = params.description;
    this.permissions = params.permissions;
    this.created = params.created;
  }

  save(params: {
    db: Database,
    user: User
  }): void {
    params.db.saveCampaign({
      campaign: this,
      user: params.user
    });
  }
}