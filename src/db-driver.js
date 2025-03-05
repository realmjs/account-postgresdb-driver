"use strict"

const { Pool } = require('pg');
const { createInsertQuery } = require('./helper');

class DbDriver {

  constructor(options) {
    this.envConfigs = {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ...(process.env.NODE_ENV !== 'development' && {
        ssl: {
          rejectUnauthorized: false // Allows SSL connection; disables certificate verification
        }
      })
    };

    this.pool = new Pool({
      ...this.envConfigs,
      max: options?.poolSize || undefined,
    })
  }

  App = {
    find: async({ id }) => {
      const query = `
        SELECT
          App.*,
          Realm.key
        FROM
          App
        INNER JOIN
          Realm
        ON
          App.realm = Realm.id
        WHERE
          App.id = $1
      `
      const result = await this.pool.query(query, [id]);
      return result.rows[0];
    }
  }

  Account = {
    find: async({ uid, email }) => {
      const prop = uid !== undefined ? { name: 'uid', value: uid } : { name: 'email', value: email }
      const result = await this.pool.query(`SELECT * FROM Account WHERE ${prop.name} = $1`, [prop.value]);
      const acc = result.rows[0];
      if (acc?.uid) {
        const account  = { profile: {}, realms: {} };
        ['uid', 'salty', 'credentials', 'created_at'].forEach(key => account[key] = acc[key]);
        ['fullname', 'display_name', 'gender', 'email', 'phone', 'additional_phone', 'additional_email',  'address'].forEach(key => account.profile[key] = acc[key]);
        // get realm
        const result = await this.pool.query(`SELECT realm, roles FROM UserRealm WHERE uid = $1`, [account?.uid]);
        if (result.rows.length > 0) {
          for (const row of  result.rows) {
            account.realms[row?.realm] = { roles: row.roles };
          }
        }
        return account;
      } else {
        return undefined
      }
    },

    insert: async(user) => {
      const { realms, profile, ...account } = user;
      for (const key in profile) {
        account[key] = profile[key];
      }
      {
          const [text, values] = createInsertQuery('Account', account, { returning: '*' });
          const { rows } = await this.pool.query(text, values);
          account.uid = rows[0].uid;
      }
      {
        const rows = [];
        for  (const realm in realms) {
          rows.push({
            uid: account.uid,
            realm: realm,
            roles: realms[realm]?.roles,
            joined_at: new Date(),
          });
        }
        const [text, values] = createInsertQuery('UserRealm', rows);
        await this.pool.query(text, values);
      }
      return { uid: account.uid, ...user }
    },

    Password: {
      update: async (uid, changeValue) => {
        const query = `
          UPDATE
            Account
          SET
            credentials = $1
          WHERE
            uid = $2
        `
        await this.pool.query(query, [{ password: changeValue }, uid]);
      }
    },

    Profile: {
      update: async (uid, changeValue) => {
        const updateFields = Object.keys(changeValue)
          .map((key) => `"${key}" = $${Object.keys(changeValue).indexOf(key) + 1}`)
          .join(', ');

        const query = `
          UPDATE
            Account
          SET
            ${updateFields}
          WHERE
            uid  = $${Object.keys(changeValue).length + 1}
        `;
        await this.pool.query(query, [...Object.values(changeValue), uid]);
      }

    }
  }

  LoginSession = {
    find: async ({uid, sid}) => {
      const { rows } = await this.pool.query('SELECT * FROM LoginSession WHERE uid = $1 AND sid = $2', [uid, sid]);
      return rows[0];
    },

    insert: async (session) => {
      const [text, values] = createInsertQuery('LoginSession', session);
      await this.pool.query(text, values);
    },

    remove: async ({uid, sid}) => {
      if (sid) {
        await this.pool.query('DELETE FROM LoginSession WHERE uid = $1 AND sid = $2', [uid, sid]);
      } else {
        await this.pool.query('DELETE FROM LoginSession WHERE uid = $1', [uid]);
      }
    },
  }

}

module.exports = DbDriver;
