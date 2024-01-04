"use strict"

const { Pool } = require('pg');

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
    }
  }

}

module.exports = DbDriver;
