-- PostgreSQL version for Supabase
-- No need for CREATE DATABASE or USE statements in Supabase

-- Table: Player
CREATE TABLE Player (
    player_id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    age INTEGER CHECK (age >= 13 AND age <= 60),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Team
CREATE TABLE Team (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    captain_id INTEGER
);

-- Table: Tournament
CREATE TABLE Tournament (
    tour_id SERIAL PRIMARY KEY,
    tour_name VARCHAR(100) NOT NULL,
    tour_season VARCHAR(50),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    organizer_team_id INTEGER,
    max_participants INTEGER DEFAULT 16,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Match_Table (karena Match adalah reserved word)
CREATE TABLE Match_Table (
    match_id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    round VARCHAR(50) NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    team1_id INTEGER NOT NULL,
    team2_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Match_Result
CREATE TABLE Match_Result (
    result_id SERIAL PRIMARY KEY,
    match_id INTEGER UNIQUE NOT NULL,
    winner_team_id INTEGER,
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    match_duration INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Team_Members (Junction table)
CREATE TABLE Team_Members (
    team_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('captain', 'member', 'substitute')),
    joined_date TIMESTAMP DEFAULT NOW(),
    left_date TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (team_id, player_id, joined_date)
);

-- Table: Tournament_Participants (Junction table)
CREATE TABLE Tournament_Participants (
    tournament_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    registration_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'eliminated', 'withdrawn')),
    seed_number INTEGER,
    PRIMARY KEY (tournament_id, team_id)
);

-- Add Foreign Key Constraints
ALTER TABLE Team 
ADD CONSTRAINT fk_team_captain 
FOREIGN KEY (captain_id) REFERENCES Player(player_id) ON DELETE SET NULL;

ALTER TABLE Tournament 
ADD CONSTRAINT fk_tournament_organizer 
FOREIGN KEY (organizer_team_id) REFERENCES Team(team_id) ON DELETE SET NULL;

ALTER TABLE Match_Table 
ADD CONSTRAINT fk_match_tournament 
FOREIGN KEY (tournament_id) REFERENCES Tournament(tour_id) ON DELETE CASCADE;

ALTER TABLE Match_Table 
ADD CONSTRAINT fk_match_team1 
FOREIGN KEY (team1_id) REFERENCES Team(team_id) ON DELETE CASCADE;

ALTER TABLE Match_Table 
ADD CONSTRAINT fk_match_team2 
FOREIGN KEY (team2_id) REFERENCES Team(team_id) ON DELETE CASCADE;

ALTER TABLE Match_Result 
ADD CONSTRAINT fk_result_match 
FOREIGN KEY (match_id) REFERENCES Match_Table(match_id) ON DELETE CASCADE;

ALTER TABLE Match_Result 
ADD CONSTRAINT fk_result_winner 
FOREIGN KEY (winner_team_id) REFERENCES Team(team_id) ON DELETE SET NULL;

ALTER TABLE Team_Members 
ADD CONSTRAINT fk_members_team 
FOREIGN KEY (team_id) REFERENCES Team(team_id) ON DELETE CASCADE;

ALTER TABLE Team_Members 
ADD CONSTRAINT fk_members_player 
FOREIGN KEY (player_id) REFERENCES Player(player_id) ON DELETE CASCADE;

ALTER TABLE Tournament_Participants 
ADD CONSTRAINT fk_participants_tournament 
FOREIGN KEY (tournament_id) REFERENCES Tournament(tour_id) ON DELETE CASCADE;

ALTER TABLE Tournament_Participants 
ADD CONSTRAINT fk_participants_team 
FOREIGN KEY (team_id) REFERENCES Team(team_id) ON DELETE CASCADE;

-- Add Constraints yang diperlukan
ALTER TABLE Match_Table 
ADD CONSTRAINT chk_different_teams 
CHECK (team1_id != team2_id);

ALTER TABLE Tournament 
ADD CONSTRAINT chk_tournament_dates 
CHECK (end_date > start_date);

ALTER TABLE Match_Result 
ADD CONSTRAINT chk_positive_scores 
CHECK (team1_score >= 0 AND team2_score >= 0);

-- Create Indexes untuk Performance
CREATE INDEX idx_player_username ON Player(username);
CREATE INDEX idx_team_name ON Team(team_name);
CREATE INDEX idx_tournament_date ON Tournament(start_date, end_date);
CREATE INDEX idx_match_tournament ON Match_Table(tournament_id);
CREATE INDEX idx_match_teams ON Match_Table(team1_id, team2_id);
CREATE INDEX idx_match_status ON Match_Table(status, scheduled_at);
CREATE INDEX idx_team_members_active ON Team_Members(team_id, is_active);
CREATE INDEX idx_tournament_status ON Tournament_Participants(tournament_id, status);

-- Insert Sample Data
-- Players
INSERT INTO Player (player_name, age, username, email) VALUES 
('Ahmad Wijaya', 22, 'ahmad_pro', 'ahmad@email.com'),
('Sari Indah', 20, 'sari_gamer', 'sari@email.com'),
('Budi Santoso', 25, 'budi_legend', 'budi@email.com'),
('Citra Dewi', 19, 'citra_star', 'citra@email.com'),
('Doni Pratama', 23, 'doni_esport', 'doni@email.com'),
('Eka Putri', 21, 'eka_pro', 'eka@email.com'),
('Fajar Muslim', 24, 'fajar_king', 'fajar@email.com'),
('Gita Sari', 20, 'gita_queen', 'gita@email.com');

-- Teams
INSERT INTO Team (team_name, captain_id) VALUES 
('Fire Dragons', 1),
('Ice Wolves', 3),
('Lightning Eagles', 5),
('Shadow Panthers', 7);

-- Team Members
INSERT INTO Team_Members (team_id, player_id, role, is_active) VALUES 
(1, 1, 'captain', TRUE), (1, 2, 'member', TRUE),
(2, 3, 'captain', TRUE), (2, 4, 'member', TRUE),
(3, 5, 'captain', TRUE), (3, 6, 'member', TRUE),
(4, 7, 'captain', TRUE), (4, 8, 'member', TRUE);

-- Tournaments
INSERT INTO Tournament (tour_name, tour_season, start_date, end_date, organizer_team_id, max_participants) VALUES 
('Championship 2024', 'Season 1', '2024-07-01 10:00:00', '2024-07-15 18:00:00', 1, 8),
('Winter Cup 2024', 'Season 2', '2024-12-01 10:00:00', '2024-12-10 18:00:00', 2, 16);

-- Tournament Participants
INSERT INTO Tournament_Participants (tournament_id, team_id, status, seed_number) VALUES 
(1, 1, 'confirmed', 1), (1, 2, 'confirmed', 2),
(1, 3, 'confirmed', 3), (1, 4, 'confirmed', 4);

-- Matches
INSERT INTO Match_Table (tournament_id, round, scheduled_at, team1_id, team2_id, status) VALUES 
(1, 'Semifinal 1', '2024-07-10 14:00:00', 1, 2, 'completed'),
(1, 'Semifinal 2', '2024-07-10 16:00:00', 3, 4, 'completed'),
(1, 'Final', '2024-07-15 15:00:00', 1, 3, 'completed');

-- Match Results
INSERT INTO Match_Result (match_id, winner_team_id, team1_score, team2_score, match_duration, notes) VALUES 
(1, 1, 2, 1, 45, 'Great match, very close game'),
(2, 3, 1, 2, 52, 'Comeback victory for Lightning Eagles'),
(3, 1, 3, 1, 38, 'Fire Dragons wins Championship 2024');