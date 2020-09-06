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
  timeadded DATETIME,
  approvedby VARCHAR(20),
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
  lorpoints int(11) NOT NULL DEFAULT 0,
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

CREATE TABLE mod_stats
(
    id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    time DATETIME,
    online INT(11),
    idle INT(11),
    dnd INT(11),
    offline INT(11)
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

CREATE TABLE namemix
(
  id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name_piece VARCHAR(20) NOT NULL,
  part TINYINT(1) NOT NULL,
  addedon DATETIME,
  addedby BIGINT(20)
);

CREATE TABLE trivia_questions
(
  id INT(11) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  user VARCHAR(20) NOT NULL,
  question VARCHAR(400) NOT NULL,
  timecreated DATETIME,
  isopen TINYINT(1) NOT NULL DEFAULT 1,
  watched TINYINT(1) NOT NULL DEFAULT 0
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