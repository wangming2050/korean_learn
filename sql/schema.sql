-- schema.sql
-- 创建数据库、数据表，并插入一些演示数据。

CREATE DATABASE IF NOT EXISTS korean_learn
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE korean_learn;

DROP TABLE IF EXISTS sentence;
DROP TABLE IF EXISTS vocabulary;
DROP TABLE IF EXISTS material;
DROP TABLE IF EXISTS scene;

CREATE TABLE scene (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50)
);

CREATE TABLE sentence (
  id INT PRIMARY KEY AUTO_INCREMENT,
  korean VARCHAR(200),
  chinese VARCHAR(200),
  audio_url VARCHAR(300),
  audio_start FLOAT DEFAULT 0,
  audio_end FLOAT DEFAULT 0,
  scene_id INT,
  FOREIGN KEY (scene_id) REFERENCES scene(id)
);

CREATE TABLE vocabulary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  korean VARCHAR(100),
  chinese VARCHAR(100),
  pos VARCHAR(20)
);

CREATE TABLE material (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100),
  chapter VARCHAR(50),
  audio_url VARCHAR(300),
  content TEXT
);

INSERT INTO scene (name) VALUES
('打招呼'),
('问路'),
('购物'),
('餐厅');

INSERT INTO sentence (korean, chinese, audio_url, audio_start, audio_end, scene_id) VALUES
('안녕하세요.', '你好。', '/static/audio/demo.mp3', 0, 2, 1),
('만나서 반갑습니다.', '见到你很高兴。', '/static/audio/demo.mp3', 2, 5, 1),
('지하철역이 어디예요?', '地铁站在哪里？', '/static/audio/demo.mp3', 5, 8, 2),
('이거 얼마예요?', '这个多少钱？', '/static/audio/demo.mp3', 8, 11, 3),
('김치찌개 하나 주세요.', '请给我一份泡菜汤。', '/static/audio/demo.mp3', 11, 15, 4);

INSERT INTO vocabulary (korean, chinese, pos) VALUES
('안녕하세요', '你好', '感叹语'),
('어디', '哪里', '代词'),
('얼마', '多少', '名词'),
('주세요', '请给我', '动词表达');

INSERT INTO material (title, chapter, audio_url, content) VALUES
(
  '初级韩语听读',
  '第 1 课',
  '/static/audio/demo.mp3',
  '[{"text":"안녕하세요.","start":0,"end":2},{"text":"만나서 반갑습니다.","start":2,"end":5},{"text":"지하철역이 어디예요?","start":5,"end":8}]'
);
