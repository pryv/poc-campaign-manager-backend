const bcrypt = require('bcrypt');
const sqlite3 = require('better-sqlite3');
const config = require('../../dist/src/config');
const User = require('../../dist/src/business').User;

const db = new sqlite3(config.get('database:path'), config.get('database:options'));

const getVersion = db.prepare('SELECT version from versions');
const getPasswordsStatement = db.prepare('SELECT u.local_user_id, u.password from local_users u;');
const updatePasswordsStatement = db.prepare('UPDATE local_users SET password=@hashedPassword WHERE local_user_id=@localId;');
const updateVersion = db.prepare('INSERT INTO versions (version) VALUES (2);');

const versions = getVersion.all();
let latestVersion = 0;
versions.forEach((v) => {
  if (v.version > latestVersion) {
    latestVersion = v.version;
  }
});
if (latestVersion === 2)
  return console.log('migration skipped because version is up to date.');

const users = getPasswordsStatement.all().map(convertFromDB);

let rowsChanged = 0;
users.forEach((u) => {
  const hash = bcrypt.hashSync(u.password, 10);
  const rows = updatePasswordsStatement.run({
    localId: u.localId,
    hashedPassword: hash,
  });
  rowsChanged += rows.changes;
});
console.log('updated ', rowsChanged, 'rows');

updateVersion.run();

db.close();


function convertFromDB(result) {
  if (result) {
    const createdUser = new User({
      id: result.user_id,
      username: result.username,
      pryvUsername: result.pryv_username,
      pryvId: result.pryv_user_id,
      localId: result.local_user_id,
      password: result.password,
    });
    return createdUser;
  }
}