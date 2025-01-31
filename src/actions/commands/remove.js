const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {logGuild} = require('../../utils/logger');
const {notify} = require('../commands');
const config = require('../../configs/config.js');
const {escaping} = require('../../utils/string.js');
const {getQueue} = require('../player');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Удаляет композицию из очереди')
    .addIntegerOption(o => o
      .setName('target')
      .setDescription('Номер в очереди целевой композиции')
      .setRequired(true)),
  async execute(interaction) {
    await module.exports.remove(interaction, true);
  },
  async listener(_interaction) {},
}

module.exports.remove = async (interaction, isExecute, targetIndex = interaction.options.getInteger("target") - 1) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_REMOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"remove\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('remove', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде remove запрещен',
    });
    return {result: 'Доступ к команде запрещен'};
  }

  if (!getQueue(interaction.guildId).songs || getQueue(interaction.guildId).songs.length < 1) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Ты одинок что ли? Соло-игрок?')
      .setDescription('Пытаться удалить то, чего нет, показывает все твое отчаяние. **Пуст плейлист. Пуст.**')
      .setTimestamp();
    if (isExecute) {
      await notify('remove', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[remove]: Удалить композицию не вышло: плеер не играет`);
    return {result: "Плеер не играет"};
  }

  if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
    && getQueue(interaction.guildId).connection.joinConfig.channelId !==
    interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Канал не тот')
      .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
      .setTimestamp();
    if (isExecute) {
      await notify('remove', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[remove]: Удалить композицию не вышло: не совпадают каналы`);
    return {result: "Не совпадают каналы"};
  }

  if (targetIndex < 0 || targetIndex + 1 > getQueue(interaction.guildId).songs.length) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Ты это.. Вселенной ошибся, чел.')
      .setDescription(`Типа знаешь вселенная расширяется, а твой мозг походу нет. Ну вышел ты за пределы размеров очереди.`)
      .setTimestamp();
    if (isExecute) {
      await notify('remove', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[remove]: Удалить композицию не вышло: выход за пределы очереди`);
    return {result: "Выход за пределы очереди"};
  }

  const target = getQueue(interaction.guildId).songs[targetIndex];

  getQueue(interaction.guildId).songs.splice(targetIndex, 1);
  getQueue(interaction.guildId).remained -= target.length;
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle('Целевая композиция дезинтегрирована')
    .setDescription(`Композиция **${escaping(target.title)}** была стерта из реальности очереди.`);
  if (isExecute) {
    await notify('remove', interaction, {embeds: [embed]});
  }
  logGuild(interaction.guildId, `[remove]: Композиция была успешно удалена из очереди`);
  return {isRemoved: target};
} 
