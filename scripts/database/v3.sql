BEGIN TRANSACTION;

PRAGMA foreign_keys = ON;

ALTER TABLE campaigns RENAME TO TempOldTable;

CREATE TABLE campaigns (
  campaign_id STRING PRIMARY_KEY NOT NULL UNIQUE,
  title text NOT NULL,
  pryv_app_id text,
  description text NOT NULL,
  permissions text not NULL,
  created integer NOT NULL,
  modified integer NOT NULL,
  status string NOT NULL,
  user_id string NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
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
  status,
  user_id
 FROM TempOldTable;
DROP TABLE TempOldTable;

ALTER TABLE invitations RENAME TO TempOldTable;

CREATE TABLE invitations (
  invitation_id string PRIMARY_KEY NOT NULL UNIQUE,
  access_token string,
  status string NOT NULL,
  created integer NOT NULL,
  modified integer NOT NULL,
  campaign_id string NOT NULL,
  requester_id string NOT NULL,
  requestee_id string NOT NULL,
  head_id string,
  FOREIGN KEY (requester_id) REFERENCES users(user_id),
  FOREIGN KEY (requestee_id) REFERENCES users(user_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
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
  head_id
 FROM TempOldTable;
DROP TABLE TempOldTable;

ALTER TABLE users RENAME TO TempOldTable;
CREATE TABLE IF NOT EXISTS users (
  user_id string PRIMARY_KEY NOT NULL UNIQUE
);

INSERT INTO users (
  user_id
) SELECT 
  user_id
 FROM TempOldTable;
DROP TABLE TempOldTable;

ALTER TABLE local_users RENAME TO TempOldTable;
CREATE TABLE local_users (
  local_user_id string PRIMARY_KEY NOT NULL UNIQUE,
  username string UNIQUE NOT NULL,
  password string NOT NULL,
  user_id string UNIQUE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

INSERT INTO local_users (
  local_user_id,
  username,
  password,
  user_id
) SELECT
  local_user_id,
  username,
  password,
  user_id
 FROM TempOldTable;
DROP TABLE TempOldTable;

ALTER TABLE pryv_users RENAME TO TempOldTable;
CREATE TABLE IF NOT EXISTS pryv_users (
  pryv_user_id string PRIMARY_KEY NOT NULL UNIQUE,
  pryv_username string UNIQUE,
  pryv_token string,
  user_id string UNIQUE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

INSERT INTO pryv_users (
  pryv_user_id,
  pryv_username,
  pryv_token,
  user_id
) SELECT 
  pryv_user_id,
  pryv_username,
  pryv_token,
  user_id
 FROM TempOldTable;
DROP TABLE TempOldTable;

ALTER TABLE accesses RENAME TO TempOldTable;
CREATE TABLE IF NOT EXISTS accesses (
  access_id string PRIMARY_KEY NOT NULL UNIQUE,
  created integer NOT NULL,
  valid boolean NOT NULL,
  valid_until integer NOT NULL,
  user_id string NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

INSERT INTO accesses (
  access_id,
  created,
  valid,
  valid_until,
  user_id
) SELECT 
  access_id,
  created,
  valid,
  valid_until,
  user_id
 FROM TempOldTable;
DROP TABLE TempOldTable;

INSERT INTO versions (
  version
) VALUES (
  3
);

END TRANSACTION;