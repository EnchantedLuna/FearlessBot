CREATE TABLE channel_stats
(
  channel VARCHAR(30) NOT NULL,
  total_messages INT(11) DEFAULT '0' NOT NULL,
  name VARCHAR(20),
  web TINYINT(1) DEFAULT '0',
  server VARCHAR(30) DEFAULT '' NOT NULL,
  startdate INT(11),
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
  CONSTRAINT `PRIMARY` PRIMARY KEY (server, keyword)
);
CREATE TABLE members
(
  id BIGINT(20) NOT NULL,
  username VARCHAR(50),
  lastseen INT(11),
  words INT(11) DEFAULT '0',
  messages INT(11) DEFAULT '0',
  server VARCHAR(30) DEFAULT '' NOT NULL,
  active TINYINT(1) DEFAULT '1',
  discriminator INT(4),
  poops int(11) DEFAULT '0'
  CONSTRAINT `PRIMARY` PRIMARY KEY (server, id)
);
CREATE INDEX idx_username ON members (server, username);
CREATE TABLE names
(
  rank INT(4),
  name VARCHAR(25),
  gender CHAR(1),
  year INT(4)
);
CREATE TABLE messages
(
  id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  discord_id BIGINT(20),
  date DATETIME,
  server BIGINT(20),
  channel BIGINT(20),
  message VARCHAR(2000),
  edited DATETIME,
  author BIGINT(20)
);
CREATE INDEX idx_author ON messages (server, author);
CREATE INDEX idx_messages ON messages (server);
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
    effectivetime DATETIME,
    completed TINYINT(1) NOT NULL DEFAULT 0
);

CREATE VIEW `message_view` AS select `msg`.`id` AS `id`,`mem`.`username` AS `username`,`msg`.`date` AS `date`,`c`.`name` AS `channelname`,`msg`.`message` AS `message` from ((`messages` `msg` join `members` `mem` on(((`msg`.`server` = `mem`.`server`) and (`msg`.`author` = `mem`.`id`)))) join `channel_stats` `c` on(((`msg`.`server` = `c`.`server`) and (`msg`.`channel` = `c`.`channel`))));