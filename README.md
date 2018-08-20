
# app-node-campaign-management

ExpressJS app for campaign management.

*Prerequisites*: Node v8+, Yarn v1+

## Usage

Download dependencies: `yarn install`

Transpile: `yarn release`

Launch transpilation watcher: `yarn watch`

### Run

Run server: `yarn start`

### Contribute

Run Flow checker: `yarn flow`

Run Flow coverage: `yarn flow-coverage`

Add Flow-typed libs (to run after adding new dependencies): `yarn flow:deps`

Run tests: `yarn test`

Run linter: `yarn lint`

### Database migration

*Prerequisites:* sqlite3 CLI

When an update involves a database structure change (such as adding a new column), it is necessary to update its tables.

On your deploy, check the version using:

```sqlite
sqlite3 campaign-management.db
SQLite version 3.16.0 2016-11-04 19:09:39
Enter ".help" for usage hints.
sqlite> .read scripts/database/v1.sql
```

There should not be any messages if the script was executed with no errors.

#### Database migration script hints

- Use `BEGIN TRANSACTION;` and `END TRANSACTION;` so you can roll back if an issue arises. Closing the connection executes a rollback.
- Update the database version when applying changes.
- see [scripts/database/v1.sql](scripts/database/v1.sql) for reference.