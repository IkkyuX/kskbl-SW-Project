CREATE DATABASE IF NOT EXISTS student_community
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE student_community;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  u_number BIGINT UNIQUE,
  email VARCHAR(128) UNIQUE,
  phone VARCHAR(32) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  register_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT PRIMARY KEY,
  nickname VARCHAR(64) NOT NULL,
  avatar_url VARCHAR(255),
  gender VARCHAR(16),
  nationality VARCHAR(64),
  school_code VARCHAR(64),
  major VARCHAR(128),
  grade VARCHAR(32),
  level INT NOT NULL DEFAULT 1,
  languages VARCHAR(255),
  bio TEXT,
  privacy_level VARCHAR(32) NOT NULL DEFAULT 'PUBLIC',
  arrived_at_korea DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tag_type VARCHAR(32) NOT NULL,
  name_zh VARCHAR(64) NOT NULL,
  name_ko VARCHAR(64) NOT NULL,
  name_en VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_tags (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_tag (user_id, tag_id),
  CONSTRAINT fk_user_tags_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE IF NOT EXISTS friendships (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  friend_user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_friendships_user_friend (user_id, friend_user_id),
  CONSTRAINT fk_friendships_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_friendships_friend_user FOREIGN KEY (friend_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  requester_user_id BIGINT NOT NULL,
  receiver_user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_friend_requests_pair (requester_user_id, receiver_user_id),
  KEY idx_friend_requests_requester_updated (requester_user_id, updated_at),
  KEY idx_friend_requests_receiver_updated (receiver_user_id, updated_at),
  KEY idx_friend_requests_status_updated (status, updated_at),
  CONSTRAINT fk_friend_requests_requester FOREIGN KEY (requester_user_id) REFERENCES users(id),
  CONSTRAINT fk_friend_requests_receiver FOREIGN KEY (receiver_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS verification_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  verify_type VARCHAR(32) NOT NULL,
  file_url VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  reject_reason VARCHAR(255),
  reviewed_by BIGINT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_verification_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(128) NOT NULL,
  scene VARCHAR(32) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'SENT',
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_email_verification_codes_lookup (email, scene, created_at)
);

CREATE TABLE IF NOT EXISTS match_recommendations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  target_user_id BIGINT NOT NULL,
  match_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  match_reason VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'RECOMMENDED',
  recommended_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_match_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_match_target_user FOREIGN KEY (target_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_type VARCHAR(32) NOT NULL DEFAULT 'PRIVATE',
  group_number BIGINT UNIQUE NULL,
  group_name VARCHAR(128) NULL,
  group_description TEXT NULL,
  group_avatar_url VARCHAR(255) NULL,
  last_message_id BIGINT NULL,
  last_message_at DATETIME NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  unread_count INT NOT NULL DEFAULT 0,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uk_conversation_member (conversation_id, user_id),
  CONSTRAINT fk_conversation_members_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_conversation_members_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  message_type VARCHAR(32) NOT NULL DEFAULT 'TEXT',
  content TEXT NOT NULL,
  media_url VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'SENT',
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS boards (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name_zh VARCHAR(64) NOT NULL,
  name_ko VARCHAR(64) NOT NULL,
  name_en VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS circles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name_zh VARCHAR(64) NOT NULL,
  icon_emoji VARCHAR(255) NOT NULL DEFAULT '⭐',
  description TEXT NOT NULL,
  owner_user_id BIGINT NOT NULL,
  announcement TEXT NOT NULL,
  member_count INT NOT NULL DEFAULT 0,
  post_count INT NOT NULL DEFAULT 0,
  hot_score INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_circles_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS circle_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  circle_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  unread_count INT NOT NULL DEFAULT 0,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_circle_member (circle_id, user_id),
  CONSTRAINT fk_circle_members_circle FOREIGN KEY (circle_id) REFERENCES circles(id),
  CONSTRAINT fk_circle_members_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  board_id BIGINT NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  favorite_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_posts_board FOREIGN KEY (board_id) REFERENCES boards(id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'VISIBLE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_post_comments_post FOREIGN KEY (post_id) REFERENCES posts(id),
  CONSTRAINT fk_post_comments_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS post_favorites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_post_favorites (post_id, user_id),
  CONSTRAINT fk_post_favorites_post FOREIGN KEY (post_id) REFERENCES posts(id),
  CONSTRAINT fk_post_favorites_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS article_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name_zh VARCHAR(64) NOT NULL,
  name_ko VARCHAR(64) NOT NULL,
  name_en VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS articles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  title_zh VARCHAR(255) NOT NULL,
  title_ko VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  content_zh TEXT NOT NULL,
  content_ko TEXT NOT NULL,
  content_en TEXT NOT NULL,
  source_name VARCHAR(128),
  source_url VARCHAR(255),
  published_at DATETIME NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_articles_category FOREIGN KEY (category_id) REFERENCES article_categories(id)
);

CREATE TABLE IF NOT EXISTS report_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reporter_user_id BIGINT NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT NOT NULL,
  reason_code VARCHAR(64) NOT NULL,
  description VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  processed_by BIGINT NULL,
  processed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_records_user FOREIGN KEY (reporter_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS block_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  target_user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_block_records (user_id, target_user_id),
  CONSTRAINT fk_block_records_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_block_records_target_user FOREIGN KEY (target_user_id) REFERENCES users(id)
);

CREATE INDEX idx_match_recommendations_user_time ON match_recommendations(user_id, recommended_at);
CREATE INDEX idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX idx_messages_conversation_time ON messages(conversation_id, sent_at);
CREATE INDEX idx_posts_board_time ON posts(board_id, created_at);
CREATE INDEX idx_articles_category_status_time ON articles(category_id, status, updated_at);
CREATE INDEX idx_report_records_target ON report_records(target_type, target_id);

INSERT INTO boards (name_zh, name_ko, name_en, sort_order) VALUES
('新生报到', '신입생 신고', 'New Students', 1),
('学习选课', '수업 및 학업', 'Study & Courses', 2),
('租房生活', '주거 및 생활', 'Housing & Living', 3),
('打工兼职', '아르바이트', 'Part-time Jobs', 4),
('交友活动', '교류 활동', 'Social Activities', 5),
('匿名树洞', '익명 게시판', 'Anonymous Talk', 6)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);

INSERT INTO article_categories (name_zh, name_ko, name_en, sort_order) VALUES
('入境准备', '입국 준비', 'Entry Preparation', 1),
('学校报到', '학교 등록', 'School Registration', 2),
('签证证件', '비자 및 서류', 'Visa & Documents', 3),
('住宿交通', '주거 및 교통', 'Housing & Transport', 4),
('银行通信', '은행 및 통신', 'Banking & SIM', 5),
('奖学金实习', '장학금 및 인턴', 'Scholarship & Internship', 6)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);
