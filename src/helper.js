"use strict"

const createInsertQuery = (table, item, options) => {
  const items = Array.isArray(item) ? item : [item];

  const keys = Object.keys(items[0]);
  let text = `INSERT INTO ${table} (${keys.join(',')}) VALUES`;
  const values = [];

  let lastIdx = 1;
  for (const item of items) {
    const keys = Object.keys(item);
    text += ` (${keys.map((_, index) => `$${index + lastIdx}`).join(',')}),`;
    lastIdx += keys.length;
    values.push(...keys.map(key => item[key]));
  }
  text = text.replace(/,$/,'');

  text += options?.returning && ` RETURNING ${options?.returning}` || '';
  text += options?.onConflict?.keys?.length > 0 && ` ON CONFLICT (${options.onConflict.keys.join(',')}) DO ${options.onConflict.do}` || '';

  return [text, values];
}

module.exports = {
  createInsertQuery,
};
