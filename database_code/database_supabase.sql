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