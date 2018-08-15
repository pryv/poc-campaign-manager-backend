// @flow

import type {Database} from '../database';
import type { User } from '.';

const cuid = require('cuid');
const slugify = require('slugify');

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

type CampaignStatus = 'created' | 'cancelled';

class Campaign {

  id: string;
  title: string;
  pryvAppId: string;
  description: string;
  permissions: Array<Permission>;
  created: number;
  requester: string; // local_username
  modified: number;
  status: CampaignStatus;

  constructor(params: {
    id?: string,
    title: string,
    pryvAppId?: string,
    description: string,
    permissions: Array<Permission>,
    created?: number,
    requester?: string,
    modified?: number,
    status?: CampaignStatus,

  }) {
    this.id = params.id || cuid();
    this.title = params.title;
    this.pryvAppId = params.pryvAppId || derivateFromTitle(params.title);
    this.description = params.description;
    this.permissions = params.permissions;
    this.created = params.created || Date.now() / 1000;
    this.requester = params.requester || null;
    this.modified = params.modified || this.created;
    this.status = params.status || 'created';
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

  cancel(params: {
    db: Database,
  }): Campaign {
    this.status = 'cancelled';
    this.modified = Date.now() / 1000;

    return params.db.campaigns.cancel({
      campaign: this,
    });
  }
}
module.exports = Campaign;

function derivateFromTitle(title: string): string {
  return 'cm-' + slugify(title.toLowerCase());
}