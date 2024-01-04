"use strict"

const createInsertQuery = (table, item, options) => {
  const keys = Object.keys(item);
  const text = ` INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_, index) => `$${index+1}`).join(',')}) ${options?.returning && `RETURNING ${options?.returning}` || ''}`;
  const values = keys.map(key => item[key]);
  return [text, values];
}

module.exports = {
  createInsertQuery,
};
