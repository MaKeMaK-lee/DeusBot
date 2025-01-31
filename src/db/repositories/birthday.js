const {db} = require('../../actions/db');
const {transaction} = require('../dbUtils');
let todayBirthdays;
let birthdays;

module.exports.getTodayBirthdays = async () => {
  if (!todayBirthdays?.birthdays || todayBirthdays?.today.getDay() !== new Date().getDay()) {
    const response = await db.query(`SELECT *
                                     FROM BIRTHDAY
                                     WHERE DATE_PART('month', DATE) = DATE_PART('month', current_date)
                                       AND DATE_PART('day', DATE) = DATE_PART('day', current_date)`);
    todayBirthdays = {today: new Date(), birthdays: response.rows.map(r => ({userId: r.user_id, date: r.date, ignored: r.ignored})) || []};
  }
  return todayBirthdays.birthdays;
};

module.exports.getAll = async () => {
  if (!birthdays) {
    const response = await db.query(`SELECT *
                                     FROM BIRTHDAY`);
    birthdays = response.rows || [];
  }
  return birthdays;
};

module.exports.get = async (userId) => {
  return (await db.query('SELECT * FROM BIRTHDAY WHERE user_id=$1', [userId])).rows.map(b => ({userId: b.user_id, date: b.date, ignored: b.ignored})) || [];
};

module.exports.ignore = async (userId, ignored) => {
  const inst = (await this.get(userId))[0];
  await this.set(userId, inst?.date, ignored);
};

module.exports.set = async (userId, date, ignored = false) => {
  await transaction(async () => {
    await this.remove(userId);
    await db.query('INSERT INTO BIRTHDAY (user_id, date, ignored) VALUES ($1, $2, $3)', [userId, date, ignored]);
  });
};

module.exports.remove = async (userId) => {
  todayBirthdays = null;
  birthdays = null;
  await db.query('DELETE FROM BIRTHDAY WHERE user_id=$1', [userId]);
};
