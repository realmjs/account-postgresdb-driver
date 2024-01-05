"use strict"

const { Pool } = require('pg');
const { createInsertQuery } = require('./helper');
const account = require('../../localpostgres/scripts/account');

class DbDriver {

  constructor(options) {
    this.envConfigs = {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database:  process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
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
      const account = result.rows[0];
      if (account?.uid) {
        const result = await this.pool.query(`SELECT fullname, display_name, address, gender, phone, email FROM Profile WHERE uid = $1`, [account?.uid]);
        account.profile = result.rows[0];
      }
      return account;
    },

    insert: async(user) => {
      const { profile, ...account } = user;
      {
          const [text, values] = createInsertQuery('Account', account, { returning: '*' });
          const { rows } = await this.pool.query(text, values);
          profile.uid = rows[0].uid;
      }
      {
        const [text, values] = createInsertQuery('Profile', profile);
        await this.pool.query(text, values);
      }
      return {
        ...account,
        profile,
      }
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
      await this.pool.query('DELETE FROM LoginSession WHERE uid = $1 AND sid = $2', [uid, sid]);
    },
  }

}

module.exports = DbDriver;
