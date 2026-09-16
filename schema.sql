-- ============================================================
--  Учебная практика УП01.05
--  Веб-приложение для формирования расписания
--  СУБД: MySQL 8.x
-- ============================================================

DROP DATABASE IF EXISTS schedule_db;
CREATE DATABASE schedule_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE schedule_db;

-- ------------------------------------------------------------
--  Справочник учебных групп
-- ------------------------------------------------------------
CREATE TABLE `groups` (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(20)  NOT NULL UNIQUE,   -- П-21
    speciality  VARCHAR(100) NOT NULL,          -- Программирование
    course      TINYINT      NOT NULL,          -- 2
    CONSTRAINT chk_course CHECK (course BETWEEN 1 AND 6)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Справочник преподавателей
--  color — цвет карточки, привязан к преподавателю (п.5 ТЗ)
-- ------------------------------------------------------------
CREATE TABLE teachers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,          -- Иванов Сергей Владимирович
    short_name  VARCHAR(10)  NOT NULL,          -- ИВ
    color       CHAR(7)      NOT NULL DEFAULT '#3B82F6'  -- HEX, напр. #3B82F6
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Справочник дисциплин
-- ------------------------------------------------------------
CREATE TABLE subjects (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,   -- Основы алгоритмизации и программирования
    short_name  VARCHAR(15)  NOT NULL           -- ОАП
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Связь «один преподаватель — несколько дисциплин» (п.6 ТЗ)
--  Many-to-many: одна дисциплина тоже может вестись несколькими
-- ------------------------------------------------------------
CREATE TABLE teacher_subjects (
    teacher_id  INT NOT NULL,
    subject_id  INT NOT NULL,
    PRIMARY KEY (teacher_id, subject_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Справочник кабинетов (п.17 — дополнительный раздел)
-- ------------------------------------------------------------
CREATE TABLE classrooms (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    number      VARCHAR(10)  NOT NULL UNIQUE,   -- 305
    name        VARCHAR(100),                   -- Компьютерный класс
    room_type   VARCHAR(50),                    -- лаборатория / лекционная
    seats       SMALLINT                        -- 25
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Пользователи приложения (индивидуальное задание №4 — авторизация)
-- ------------------------------------------------------------
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
--  Занятия (карточки расписания)
--  week1_lesson / week2_lesson — номер пары на 1-й и 2-й неделе.
--  NULL означает «на этой неделе занятия нет» (— в карточке).
-- ------------------------------------------------------------
CREATE TABLE lessons (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    group_id      INT      NOT NULL,
    teacher_id    INT      NOT NULL,
    subject_id    INT      NOT NULL,
    classroom_id  INT      NULL,
    day           TINYINT  NOT NULL,            -- 1=Пн ... 6=Сб
    week1_lesson  TINYINT  NULL,                -- 1..8 или NULL
    week2_lesson  TINYINT  NULL,                -- 1..8 или NULL
    lesson_type   VARCHAR(30) NOT NULL DEFAULT 'Лекция',
    note          VARCHAR(255) NULL,            -- задел под инд. задание №18
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (group_id)     REFERENCES `groups`(id)     ON DELETE CASCADE,
    FOREIGN KEY (teacher_id)   REFERENCES teachers(id)   ON DELETE CASCADE,
    FOREIGN KEY (subject_id)   REFERENCES subjects(id)   ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,

    CONSTRAINT chk_day   CHECK (day BETWEEN 1 AND 6),
    CONSTRAINT chk_w1    CHECK (week1_lesson IS NULL OR week1_lesson BETWEEN 1 AND 8),
    CONSTRAINT chk_w2    CHECK (week2_lesson IS NULL OR week2_lesson BETWEEN 1 AND 8),
    -- занятие не может отсутствовать на обеих неделях сразу
    CONSTRAINT chk_weeks CHECK (week1_lesson IS NOT NULL OR week2_lesson IS NOT NULL)
) ENGINE=InnoDB;

-- Индексы под проверку конфликтов (ищем по преподавателю/группе + день + пара)
CREATE INDEX idx_lessons_teacher_day ON lessons (teacher_id, day);
CREATE INDEX idx_lessons_group_day   ON lessons (group_id, day);
CREATE INDEX idx_lessons_room_day    ON lessons (classroom_id, day);

-- ============================================================
--  Тестовые данные (для демонстрации на защите)
-- ============================================================

INSERT INTO `groups` (name, speciality, course) VALUES
('П-21',  'Программирование',          2),
('П-22',  'Программирование',          2),
('П-23',  'Программирование',          2),
('ИС-21', 'Информационные системы',    2);

INSERT INTO teachers (name, short_name, color) VALUES
('Иванов Сергей Владимирович',   'ИВ', '#3B82F6'),  -- синий
('Петрова Анна Ивановна',        'ПА', '#22C55E'),  -- зелёный
('Сидоров Дмитрий Алексеевич',   'СД', '#EAB308'),  -- жёлтый
('Морозова Елена Викторовна',    'МЕ', '#A855F7');  -- фиолетовый

INSERT INTO subjects (name, short_name) VALUES
('Информатика',                                  'ИНФ'),
('Основы алгоритмизации и программирования',     'ОАП'),
('Программирование',                             'ПРОГ'),
('Математика',                                   'МАТ'),
('Физика',                                       'ФИЗ'),
('Базы данных',                                  'БД');

INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES
(1, 1), (1, 2), (1, 3),   -- Иванов: Информатика, ОАП, Программирование
(2, 4), (2, 5),           -- Петрова: Математика, Физика
(3, 3), (3, 6),           -- Сидоров: Программирование, Базы данных
(4, 1), (4, 6);           -- Морозова: Информатика, Базы данных

INSERT INTO classrooms (number, name, room_type, seats) VALUES
('305', 'Компьютерный класс', 'лаборатория', 25),
('204', 'Кабинет математики', 'лекционная',  30),
('312', 'Лаборатория ПО',     'лаборатория', 20);

INSERT INTO lessons (group_id, teacher_id, subject_id, classroom_id, day,
                     week1_lesson, week2_lesson, lesson_type) VALUES
(1, 1, 1, 1, 1, 1, 2,    'Лекция'),      -- П-21, Пн, Иванов, Информатика
(1, 2, 4, 2, 1, 2, NULL, 'Практика'),    -- П-21, Пн, только 1 неделя
(2, 3, 3, 3, 1, NULL, 3, 'Лабораторная'),-- П-22, Пн, только 2 неделя
(3, 4, 6, 1, 2, 1, 1,    'Лекция');      -- П-23, Вт
