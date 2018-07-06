// @flow

import typeof {Database} from '../database';
import typeof {User} from '../business';
import cuid from 'cuid';
import slugify from 'slugify';
const uuidv4 = require('uuid/v4');
const _ = require('lodash');

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
  requester: string;

  constructor(params: {
    id?: string,
    title: string,
    pryvAppId?: string,
    description: string,
    permissions: Array<Permission>,
    created?: number,
    requester?: string,
  }) {
    this.id = params.id || cuid();
    this.title = params.title;
    this.pryvAppId = params.pryvAppId || derivateFromTitle(params.title);
    this.description = params.description;
    this.permissions = params.permissions;
    this.created = params.created || Date.now() / 1000;
    this.requester = params.requester || null;
  }

  save(params: {
    db: Database,
    user: User
  }): void {
    params.db.campaigns.save({
      campaign: this,
      user: params.user
    });
  }
}

function derivateFromTitle(title: string): string {
  return 'cm-' + slugify(title) + '-' + uuidv4();
}