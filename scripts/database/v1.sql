BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS versions (
  version INTEGER PRIMARY_KEY
);
INSERT INTO versions (
  version
) VALUES (
  1
);

ALTER TABLE campaigns RENAME TO TempOldTable;
CREATE TABLE campaigns (
  campaign_id STRING PRIMARY_KEY,
  title text NOT NULL,
  pryv_app_id text,
  description text NOT NULL,
  permissions text not NULL,
  created integer NOT NULL,
  modified integer NOT NULL,
  status string NOT NULL,
  user_id string NOT NULL
);
INSERT INTO campaigns (
  campaign_id,
  title,
  pryv_app_id,
  description,
  permissions,
  created,
  modified,
  status,
  user_id
) SELECT 
  campaign_id,
  title,
  pryv_app_id,
  description,
  permissions,
  created,
  created,
  "created",
  user_id
 FROM TempOldTable;
DROP TABLE TempOldTable;

ALTER TABLE invitations RENAME TO TempOldTable;
CREATE TABLE invitations (
  invitation_id string PRIMARY_KEY,
  access_token string,
  status string NOT NULL,
  created integer NOT NULL,
  modified integer NOT NULL,
  campaign_id string NOT NULL,
  requester_id string NOT NULL,
  requestee_id string NOT NULL,
  head_id string
);
INSERT INTO invitations (
  invitation_id,
  access_token,
  status,
  created,
  modified,
  campaign_id,
  requester_id,
  requestee_id,
  head_id
) SELECT
  invitation_id,
  access_token,
  status,
  created,
  modified,
  campaign_id,
  requester_id,
  requestee_id,
  NULL
 FROM TempOldTable;
DROP TABLE TempOldTable;

END TRANSACTION;