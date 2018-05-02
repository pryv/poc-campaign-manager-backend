// @flow

import typeof {Database} from '../database';
import cuid from 'cuid';

export class Campaign {

  id: string;
  title: string;
  username: string;
  pryvAppId: string;
  description: string;
  permissionsSet: string;
  created: ?number;

  constructor(params: {
    id?: string,
    title: string,
    username: string,
    pryvAppId: string,
    description: string,
    permissionsSet: string,
    created?: number
  }) {
    this.id = params.id || cuid();
    this.title = params.title;
    this.username = params.username;
    this.pryvAppId = params.pryvAppId;
    this.description = params.description;
    this.permissionsSet = params.permissionsSet;
    this.created = params.created;
  }

  save(db: Database): void {
    db.saveCampaign(this);
  }
}