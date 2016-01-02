CREATE TABLE members (
  id VARCHAR(30) PRIMARY KEY,
  username VARCHAR(50)  COLLATE utf8_unicode_ci,
  lastseen INT(11),
  words INT(11) DEFAULT 0,
  messages INT(11) DEFAULT 0
);

CREATE TABLE data_store (
  keyword VARCHAR(50) COLLATE utf8_unicode_ci NOT NULL PRIMARY KEY,
  value VARCHAR(255) COLLATE utf8_unicode_ci,
  owner VARCHAR(25),
  approved TINYINT(1) DEFAULT '0'
);

CREATE TABLE channel_stats (
  channel VARCHAR(25) PRIMARY KEY,
  total_messages INT(11),
  name VARCHAR(25),
  web TINYINT(1) DEFAULT 0
);