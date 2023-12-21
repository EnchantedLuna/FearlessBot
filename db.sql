CREATE TABLE channel_stats
(
  channel VARCHAR(30) NOT NULL,
  total_messages INT(11) DEFAULT '0' NOT NULL,
  name VARCHAR(32),
  web TINYINT(1) DEFAULT '0',
  server VARCHAR(30) DEFAULT '' NOT NULL,
  startdate INT(11),
  is_spam TINYINT(1) DEFAULT '0',
  blocked_commands VARCHAR(500) DEFAULT '' NOT NULL,
  CONSTRAINT `PRIMARY` PRIMARY KEY (server, channel)
);
CREATE UNIQUE INDEX idx_channel ON channel_stats (channel);
CREATE TABLE data_store
(
  keyword VARCHAR(50) DEFAULT '' NOT NULL,
  value VARCHAR(400),
  owner VARCHAR(50),
  approved TINYINT(1) DEFAULT '0',
  uses INT(11) DEFAULT '0',
  server VARCHAR(30) DEFAULT '' NOT NULL,
  lastused DATETIME,
  timeadded DATETIME,
  approvedby VARCHAR(20),
  CONSTRAINT `PRIMARY` PRIMARY KEY (server, keyword)
);
CREATE TABLE members
(
  id VARCHAR(20) NOT NULL,
  username VARCHAR(50),
  lastseen INT(11),
  words INT(11) DEFAULT '0',
  messages INT(11) DEFAULT '0',
  server VARCHAR(30) DEFAULT '' NOT NULL,
  active TINYINT(1) DEFAULT '1',
  discriminator INT(4),
  lorpoints int(11) NOT NULL DEFAULT 0,
  eventpoints int(11) NOT NULL DEFAULT 0,
  lifetime_lorpoints INT(11) NOT NULL DEFAULT 0,
  CONSTRAINT `PRIMARY` PRIMARY KEY (server, id)
);
CREATE INDEX idx_username ON members (server, username);

CREATE TABLE shitposts
(
  id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  shitpost VARCHAR(500),
  addedby BIGINT(20),
  addedon DATETIME
);

CREATE TABLE scheduled_actions
(
    id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    action VARCHAR(20),
    guild VARCHAR(20),
    user VARCHAR(20),
    roleid VARCHAR(20),
    effectivetime DATETIME,
    completed TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE user_message_stats
(
  user BIGINT(20) NOT NULL,
  guild BIGINT(20) NOT NULL,
  channel BIGINT(20) NOT NULL,
  year INT(4),
  month INT(2),
  message_count INT(11),
  PRIMARY KEY (user, guild, channel)
);

CREATE TABLE trivia_questions
(
  id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  user VARCHAR(20) NOT NULL,
  question VARCHAR(400) NOT NULL,
  timecreated DATETIME,
  isopen TINYINT(1) NOT NULL DEFAULT 1,
  watched TINYINT(1) NOT NULL DEFAULT 0,
  web_key VARCHAR(255)
);

CREATE TABLE trivia_answers
(
  id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  user VARCHAR(20) NOT NULL,
  questionid INT(11) NOT NULL,
  answer VARCHAR(1500) NOT NULL,
  viewed TINYINT(1) NOT NULL DEFAULT 0,
  time DATETIME
);

CREATE TABLE `awards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `server` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `award` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `guild_config` (
    `guild` varchar(30) NOT NULL,
    `key` varchar(30) NOT NULL,
    `value` varchar(255) NULL,
    PRIMARY KEY (`guild`, `key`)
);