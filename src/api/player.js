const {authForNowPlaying, authForVoiceMember, authForSongs, generateInteraction, generateInteractionWithVoiceChannel} = require('../utils/security');
const {skip} = require('../actions/commands/skip');
const {pause} = require('../actions/commands/pause');
const {loop} = require('../actions/commands/loop');
const {remove} = require('../actions/commands/remove');
const {move} = require('../actions/commands/move');
const {shuffle} = require('../actions/commands/shuffle');
const {clear} = require('../actions/commands/clear');
const {play} = require('../actions/commands/play');
const {getAll} = require('../db/repositories/users');
const {shikimoriPlay} = require('../actions/commands/shikimori');
const {getRadios} = require('../actions/radios');
const {radio} = require('../actions/commands/radio');

module.exports = {
  execute(params) {
    nowPlaying(params);
    queue(params);
    control(params);
  },
};

const nowPlaying = ({io, socket, client}) => {
  socket.on('nowPlaying:now', token =>
    authForNowPlaying(token, client).then(data => socket.emit('nowPlaying:now', data)));

  socket.on('nowPlaying:skip', (token, callback) =>
    authForVoiceMember(token, client)
      .then(member => generateInteractionWithVoiceChannel(member))
      .then(interaction => skip(interaction, false))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForNowPlaying(token, client)
        .then(data => io.emit('nowPlaying:now', data))));

  socket.on('nowPlaying:pause', (token, callback) =>
    authForVoiceMember(token, client)
      .then(member => generateInteractionWithVoiceChannel(member))
      .then(interaction => pause(interaction, false))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForNowPlaying(token, client)
        .then(data => io.emit('nowPlaying:now', data))));

  socket.on('nowPlaying:loop', (token, callback) =>
    authForVoiceMember(token, client)
      .then(member => generateInteractionWithVoiceChannel(member))
      .then(interaction => loop(interaction, false))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForNowPlaying(token, client)
        .then(data => io.emit('nowPlaying:now', data))));
};

const queue = ({io, socket, client}) => {
  socket.on('queue:now', (token) => authForSongs(token, client).then(data => socket.emit('queue:now', data)));

  socket.on('queue:remove', (token, index, callback) =>
    authForVoiceMember(token, client)
      .then(member => generateInteractionWithVoiceChannel(member))
      .then(interaction => remove(interaction, false, index))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForSongs(token, client)
        .then(data => io.emit('queue:now', data))));

  socket.on('queue:move', (token, from, to, callback) =>
    authForVoiceMember(token, client)
      .then(member => generateInteractionWithVoiceChannel(member))
      .then(interaction => move(interaction, false, to, from))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForSongs(token, client)
        .then(data => io.emit('queue:now', data))));
};

const control = ({io, socket, client}) => {
  socket.on('control:shuffle', (token, callback) =>
    authForVoiceMember(token, client)
      .then(member => generateInteractionWithVoiceChannel(member))
      .then(interaction => shuffle(interaction, false))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForSongs(token, client)
        .then(data => io.emit('queue:now', data))));

  socket.on('control:clear', (token, callback) =>//
    authForVoiceMember(token, client)
      .then(member => generateInteractionWithVoiceChannel(member))
      .then(interaction => clear(interaction, false))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForSongs(token, client)
        .then(data => io.emit('queue:now', data))));

  socket.on('control:play', (token, audio, callback) =>
    authForVoiceMember(token, client)
      .then(member => generateInteraction(member))
      .then(interaction => play(interaction, false, audio))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForSongs(token, client)
        .then(data => io.emit('queue:now', data))));

  socket.on('control:getShikimoriUsers', callback =>
    getAll().then(users => callback({profiles: users.map(u => u.login)})));

  socket.on('control:shikimori', (token, login, count, callback) =>
    authForVoiceMember(token, client)
      .then(member => generateInteraction(member))
      .then(interaction => shikimoriPlay(interaction, login, count))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForSongs(token, client)
        .then(data => io.emit('queue:now', data))));

  socket.on('control:getRadios', callback =>
    callback({radios: [...getRadios().keys()]}));

  socket.on('control:radio', (token, radioKey, callback) =>
    authForVoiceMember(token, client)
      .then(member => generateInteraction(member))
      .then(interaction => radio(interaction, false, radioKey))
      .then(result => callback(result))
      .catch(result => callback(result))
      .finally(() => authForSongs(token, client)
        .then(data => io.emit('queue:now', data))));
};
