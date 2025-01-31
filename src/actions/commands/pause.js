const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {logGuild} = require('../../utils/logger');
const {notify} = require('../commands');
const config = require('../../configs/config.js');
const {getQueue} = require('../player');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Приостановить/возобновить проигрывание композиции'),
  async execute(interaction) {
    await module.exports.pause(interaction, true);
  },
  async listener(_interaction) {},
};

module.exports.pause = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PAUSE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"pause\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('pause', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде pause запрещен',
    });
    return {result: 'Доступ к команде запрещен'};
  }

  if (!getQueue(interaction.guildId).nowPlaying.song || !getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Так ничего и не играло')
      .setDescription(`Как ты жалок... Зачем приостанавливать, то чего нет? Или у тебя голоса в голове?`)
      .setTimestamp();
    if (isExecute) {
      await notify('pause', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[pause]: Изменить состояние паузы не вышло: плеер не играет`);
    return {result: "Плеер не играет"};
  }

  if (getQueue(interaction.guildId)?.connection?.joinConfig?.channelId !==
    interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Канал не тот')
      .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
      .setTimestamp();
    if (isExecute) {
      await notify('pause', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[pause]: Изменить состояние паузы не вышло: не совпадают каналы`);
    return {result: "Не совпадают каналы"};
  }

  if (getQueue(interaction.guildId).nowPlaying.song.isLive) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Живая музыка')
      .setDescription(`Ты чо, пес, на горную речку попер? на живой звук с первого?.. Не, чел, это не возможно.. Такое не приостановить...`)
      .setTimestamp();
    if (isExecute) {
      await notify('pause', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[pause]: Изменить состояние паузы не вышло: играет стрим`);
    return {result: "Играет стрим"};
  }

  let isPause = getQueue(interaction.guildId).nowPlaying.isPause;
  if (isPause) {
    getQueue(interaction.guildId).player.unpause();
  } else {
    getQueue(interaction.guildId).player.pause();
  }
  getQueue(interaction.guildId).nowPlaying.isPause = !isPause;
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(`Проигрывание ${isPause ? 'возобновлено' : 'приостановлено'}`)
    .setDescription(`${isPause
      ? `-- Деда, что с тобой? Все в порядке? Ты чего завис???
                -- Да в порядке я. Уснул чутка.
                -- Слава богу
                -- Заинтриговал? Хочешь услышать продолжение истории?
                -- Да, деда. Хочу. Очень хочу
                -- Так вот. давным давно встреченный человек с необычайным разумом...
                -- Деда! Не тяни!
                -- Хорошо, внучок, хорошо. Так вот тот человек ||установил доту|| и ||пошел в рейтинг в соло с рандомами||
                -- Боже.. и что с ним стало после?
                -- Да ничего особенного. ||Апнул 5К ММР||
                -- Ничего себе, деда.
                -- Да, внучок. Теперь он в лучшем мире. Еще пару лет и я тоже туда отправлюсь
                -- Не говори такое, деда.. Такого даже врагу не пожелаешь
                -- Ха-ха-ха... Все будет в порядке внучок. Это естественно.`
      : `-- Однажды, давным давно, когда я еще был молодым, мне повстречался человек необычайных талантов. Я тогда не мог даже представить, что человеческий мозг в состоянии на такое...
                -- Что же он мог, деда?
                -- Ох, молодежь пошла, не перебивай старших, если хочешь услышать продолжение...
                -- Извини, деда
                -- Ну, так вот, на чем я остановился? Ах, да! Я встретил человека с крайне необычным разумом. До сих пор, смотря сквозь призму лет, я все еще с трудом верю, что такое могло произойти. Ну так вот, этот человек....
                -- ...
                -- ...
                -- Деда, что с тобой? Все в порядке? Ты чего завис???`}`);
  if (isExecute) {
    await notify('pause', interaction, {embeds: [embed]});
  }
  logGuild(interaction.guildId, `[pause]: Композиция была успешна ${isPause ? 'возобновлена' : 'приостановлена'}`);
  return {isPause: getQueue(interaction.guildId).nowPlaying.isPause}
}
