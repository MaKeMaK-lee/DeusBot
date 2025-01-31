const {audit} = require('../actions/auditor');
const {TYPES, CATEGORIES} = require('../db/repositories/audit');

/**
 * @deprecated
 * @param guildId
 * @param msg
 */
module.exports.logGuild = (guildId, msg) => {
  audit({guildId, type: TYPES.INFO, category: CATEGORIES.UNCATEGORIZED, message: msg});
};

/**
 * @deprecated
 * @param msg
 */
module.exports.log = (msg) => {
  audit({guildId: null, type: TYPES.INFO, category: CATEGORIES.UNCATEGORIZED, message: msg});
}

/**
 * @deprecated
 * @param msg
 */
module.exports.error = (msg) => {
  audit({guildId: null, type: TYPES.ERROR, category: CATEGORIES.UNCATEGORIZED, message: msg});
}
