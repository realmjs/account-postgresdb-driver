/*
  This test requires local-postgres is available and initialized
*/

"use strict"

import "core-js/stable"
import "regenerator-runtime/runtime"

require('dotenv').config({ path: 'test/.env' });

const DbDriver = require('../src/db-driver');

const db = new DbDriver();

afterAll(async() => await db.pool.end())

test("Find Application", async () => {

  const app = await db.App.find({ id: 'account' });

  expect(app).toEqual({
    id: 'account',
    name: 'Account Central Service',
    url: 'http://localhost:3100',
    realm: 'secure',
    key: 'realm-secure-secret-key',
  });

});

test("Find Account by email", async () => {

  const account = await db.Account.find({ email: 'dev@udu.io' });

  expect(account).toEqual({
    uid: expect.any(String),
    email: 'dev@udu.io',
    salty: {
      head: '5z3z8hf8',
      tail: 'fqbp89wk'
    },
    realms: {
      public: { roles: ['member'] }
    },
    credentials: {
      password: '04796c1b1318ee7a1711eaa9513634562549bddb792259f000e1eec9de8c96e2'
    },
    created_at: expect.any(Date),
    profile: {
      fullname: 'Awesome Dev',
      display_name: 'Awesome',
      gender: 'male',
      phone: ['0987654321'],
      email: ['dev@udu.io'],
      address: null
    }
  });

});

test("Find Account by uid", async () => {

  const { uid } = await db.Account.find({ email: 'dev@udu.io' });
  const account = await db.Account.find({ uid });

  expect(account).toEqual({
    uid: uid,
    email: 'dev@udu.io',
    salty: {
      head: '5z3z8hf8',
      tail: 'fqbp89wk'
    },
    realms: {
      public: { roles: ['member'] }
    },
    credentials: {
      password: '04796c1b1318ee7a1711eaa9513634562549bddb792259f000e1eec9de8c96e2'
    },
    created_at: expect.any(Date),
    profile: {
      fullname: 'Awesome Dev',
      display_name: 'Awesome',
      gender: 'male',
      phone: ['0987654321'],
      email: ['dev@udu.io'],
      address: null
    }
  });

});

test("Find Account by email should return undefined for non-exist one", async () => {

  const account = await db.Account.find({ email: 'nonexist@udu.io' });

  expect(account).toBeUndefined();

});

test("Find Account by uid should return undefined for non-exist one", async () => {

  const account = await db.Account.find({ uid: '99999999-9999-9999-9999-999999999990' });

  expect(account).toBeUndefined();

});

test("Insert new account", async () => {

  await db.Account.insert({
    email: 'tester@udu.io',
    salty: {
      head: '5z3z8hf8',
      tail: 'fqbp89wk'
    },
    realms: {
      public: { roles: ['member'] }
    },
    credentials: {
      password: '04796c1b1318ee7a1711eaa9513634562549bddb792259f000e1eec9de8c96e2'
    },
    created_at: new Date(),
    profile: {
      fullname: 'Awesome Test',
      display_name: 'Teser',
      gender: 'female',
      phone: ['0987654321'],
      email: ['tester@udu.io'],
      address: null
    }
   });

   const account = await db.Account.find({ email: 'tester@udu.io' });

  expect(account).toEqual({
    uid: expect.any(String),
    email: 'tester@udu.io',
    salty: {
      head: '5z3z8hf8',
      tail: 'fqbp89wk'
    },
    realms: {
      public: { roles: ['member'] }
    },
    credentials: {
      password: '04796c1b1318ee7a1711eaa9513634562549bddb792259f000e1eec9de8c96e2'
    },
    created_at: expect.any(Date),
    profile: {
      fullname: 'Awesome Test',
      display_name: 'Teser',
      gender: 'female',
      phone: ['0987654321'],
      email: ['tester@udu.io'],
      address: null
    }
  });

});

test("Update account password", async () => {

  const { uid } = await db.Account.find({ email: 'dev@udu.io' });
  await db.Account.Password.update(uid, 'QWERTY');

  const account = await db.Account.find({ email: 'dev@udu.io' });

  expect(account.credentials).toEqual({
    password: 'QWERTY'
  });

});