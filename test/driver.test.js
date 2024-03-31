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
      display_name: 'Dev',
      gender: 'male',
      email: 'dev@udu.io',
      phone: null,
      additional_phone: ['0987654321'],
      additional_email: ['dev@udu.io'],
      address: null
    }
  });

});

test("Find Account by uid", async () => {

  const { uid } = await db.Account.find({ email: 'dev@udu.io' });
  const account = await db.Account.find({ uid });

  expect(account).toEqual({
    uid: uid,
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
      display_name: 'Dev',
      gender: 'male',
      email: 'dev@udu.io',
      phone: null,
      additional_phone: ['0987654321'],
      additional_email: ['dev@udu.io'],
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
      fullname: 'Awesome Dev',
      display_name: 'Dev',
      gender: 'male',
      email: 'tester@udu.io',
      phone: null,
      additional_phone: ['0987654321'],
      additional_email: ['tester@udu.io'],
      address: null
    }
   });

   const account = await db.Account.find({ email: 'tester@udu.io' });

  expect(account).toEqual({
    uid: expect.any(String),
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
      display_name: 'Dev',
      gender: 'male',
      email: 'tester@udu.io',
      phone: null,
      additional_phone: ['0987654321'],
      additional_email: ['tester@udu.io'],
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

test("Insert, find and remove login session", async () => {

  const { uid } = await db.Account.find({ email: 'dev@udu.io' });

  await db.LoginSession.insert({
    uid: uid,
    sid: 'XxxxxxxX',
    skey: 'KKKKKKKKKKKKKKKK',
    user_agent: { isDesktop: true, os: 'Windows 11' },
    created_at: new Date()
  });

  const session = await db.LoginSession.find({
    uid: uid,
    sid: 'XxxxxxxX'
  });

  expect(session).toEqual({
    uid: uid,
    sid: 'XxxxxxxX',
    skey: 'KKKKKKKKKKKKKKKK',
    user_agent: { isDesktop: true, os: 'Windows 11' },
    created_at: expect.any(Date)
  });

  await db.LoginSession.remove({
    uid: uid,
    sid: 'XxxxxxxX'
  });

  expect(
    await db.LoginSession.find({
      uid:  uid,
      sid: 'XxxxxxxX'
    })
  ).toBeUndefined();

});

test("Remove all login sessions of a user", async () => {

  const { uid } = await db.Account.find({ email: 'dev@udu.io' });

  await db.LoginSession.insert({
    uid: uid,
    sid: 'XxxxxxxX',
    skey: 'KKKKKKKKKKKKKKKK',
    user_agent: { isDesktop: true, os: 'Windows 11' },
    created_at: new Date()
  });

  await db.LoginSession.insert({
    uid: uid,
    sid: 'YxxxxxxY',
    skey: 'KKKKKKKKKKKKKKKK',
    user_agent: { isDesktop: true, os: 'Windows 11' },
    created_at: new Date()
  });

  await db.LoginSession.remove({
    uid: uid
  });

  expect(
    await db.LoginSession.find({
      uid: uid,
      sid: 'XxxxxxxX'
    })
  ).toBeUndefined();

  expect(
    await db.LoginSession.find({
      uid: uid,
      sid: 'YxxxxxxY'
    })
  ).toBeUndefined();

});