const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://uqkmuiasomzepdilusmw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxa211aWFzb216ZXBkaWx1c213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDEwODAsImV4cCI6MjA2NDY3NzA4MH0.9dRmvUwzOqel6XrbPXg9SXCcRUae_ZHPdXQ9nyonubc';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
async function testConnection() {
    try {
        const { data, error, count } = await supabase
            .from('player')
            .select('player_id', { count: 'exact' });
        
        if (error) throw error;
        console.log('✅ Connected to Supabase Database');
        console.log(`📊 Found ${count} players in database`);
        
        const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('*', { count: 'exact' });
            
        if (membersError) {
            console.log('⚠️ team_members table exists but may be empty');
        } else {
            console.log(`👥 Found ${members.length} team memberships`);
        }
        
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
    }
}
testConnection();

// ==================== PLAYER ROUTES ====================

// Get all players with teams
app.get('/api/players', async (req, res) => {
    try {
        const { data: players, error: playersError } = await supabase
            .from('player')
            .select('*');
            
        if (playersError) throw playersError;
        
        const { data: teamMemberships, error: membersError } = await supabase
            .from('team_members')
            .select(`
                player_id,
                team (
                    team_name
                )
            `)
            .eq('is_active', true);
            
        if (membersError) throw membersError;
        
        const processedPlayers = players.map(player => {
            const playerTeams = teamMemberships
                .filter(tm => tm.player_id === player.player_id)
                .map(tm => tm.team.team_name);
                
            return {
                ...player,
                teams: playerTeams.length > 0 ? playerTeams.join(', ') : 'No team',
                team_count: playerTeams.length
            };
        });
        
        res.json(processedPlayers);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get simple players list for dropdown
app.get('/api/players/simple', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('player')
            .select('player_id, player_name')
            .order('player_name');
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching simple players:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new player
app.post('/api/players', async (req, res) => {
    const { player_name, age, username, email } = req.body;
    
    if (!player_name || !username || !email || !age) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        const { data, error } = await supabase
            .from('player')
            .insert([{ player_name, age, username, email }])
            .select();
            
        if (error) throw error;
        
        res.json({
            player_id: data[0].player_id,
            message: 'Player added successfully'
        });
    } catch (error) {
        console.error('Error adding player:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update player
app.put('/api/players/:id', async (req, res) => {
    const playerId = req.params.id;
    const { player_name, age, username, email } = req.body;
    
    if (!player_name || !username || !email || !age) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        const { error } = await supabase
            .from('player')
            .update({ player_name, age, username, email })
            .eq('player_id', playerId);
            
        if (error) throw error;
        
        res.json({ message: 'Player updated successfully' });
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete player
app.delete('/api/players/:id', async (req, res) => {
    const playerId = req.params.id;
    
    try {
        const { data: teams } = await supabase
            .from('team')
            .select('team_id')
            .eq('captain_id', playerId);
            
        if (teams && teams.length > 0) {
            return res.status(400).json({ error: 'Cannot delete player who is captain of a team' });
        }
        
        const { error } = await supabase
            .from('player')
            .delete()
            .eq('player_id', playerId);
            
        if (error) throw error;
        
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== TEAM ROUTES ====================

// Get all teams
app.get('/api/teams', async (req, res) => {
    try {
        const { data: teams, error: teamsError } = await supabase
            .from('team')
            .select('*');
            
        if (teamsError) throw teamsError;
        
        const { data: captains, error: captainsError } = await supabase
            .from('player')
            .select('player_id, player_name');
            
        if (captainsError) throw captainsError;
        
        const { data: memberCounts, error: countsError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('is_active', true);
            
        if (countsError) throw countsError;
        
        const captainMap = {};
        captains.forEach(captain => {
            captainMap[captain.player_id] = captain.player_name;
        });
        
        const teamMemberCounts = {};
        memberCounts.forEach(member => {
            teamMemberCounts[member.team_id] = (teamMemberCounts[member.team_id] || 0) + 1;
        });
        
        const processedTeams = teams.map(team => ({
            ...team,
            captain_name: captainMap[team.captain_id] || null,
            member_count: teamMemberCounts[team.team_id] || 0
        }));
        
        res.json(processedTeams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new team
app.post('/api/teams', async (req, res) => {
    const { team_name, captain_id } = req.body;
    
    if (!team_name || !captain_id) {
        return res.status(400).json({ error: 'Team name and captain are required' });
    }
    
    try {
        const { data, error } = await supabase
            .from('team')
            .insert([{ team_name, captain_id }])
            .select();
            
        if (error) throw error;
        
        const teamId = data[0].team_id;
        
        await supabase
            .from('team_members')
            .insert([{ team_id: teamId, player_id: captain_id, role: 'captain', is_active: true }]);
            
        res.json({ 
            team_id: teamId, 
            message: 'Team created successfully' 
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update team
app.put('/api/teams/:id', async (req, res) => {
    const teamId = req.params.id;
    const { team_name, captain_id } = req.body;
    
    if (!team_name || !captain_id) {
        return res.status(400).json({ error: 'Team name and captain are required' });
    }
    
    try {
        const { error } = await supabase
            .from('team')
            .update({ team_name, captain_id })
            .eq('team_id', teamId);
            
        if (error) throw error;
        
        await supabase
            .from('team_members')
            .update({ role: 'member' })
            .eq('team_id', teamId)
            .eq('role', 'captain');
            
        await supabase
            .from('team_members')
            .update({ role: 'captain' })
            .eq('team_id', teamId)
            .eq('player_id', captain_id);
            
        res.json({ message: 'Team updated successfully' });
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete team
app.delete('/api/teams/:id', async (req, res) => {
    const teamId = req.params.id;
    
    try {
        const { error } = await supabase
            .from('team')
            .delete()
            .eq('team_id', teamId);
            
        if (error) throw error;
        
        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== TOURNAMENT ROUTES ====================

// Get all tournaments
app.get('/api/tournaments', async (req, res) => {
    try {
        const { data: tournaments, error: tournamentsError } = await supabase
            .from('tournament')
            .select('*');
            
        if (tournamentsError) throw tournamentsError;
        
        const { data: teams, error: teamsError } = await supabase
            .from('team')
            .select('team_id, team_name');
            
        if (teamsError) throw teamsError;
        
        const { data: participants, error: participantsError } = await supabase
            .from('tournament_participants')
            .select('tournament_id, team_id');
            
        if (participantsError) {
            console.log('No tournament participants found, continuing...');
        }
        
        const teamMap = {};
        teams.forEach(team => {
            teamMap[team.team_id] = team.team_name;
        });
        
        const tournamentParticipants = {};
        if (participants) {
            participants.forEach(participant => {
                tournamentParticipants[participant.tournament_id] = 
                    (tournamentParticipants[participant.tournament_id] || 0) + 1;
            });
        }
        
        const processedTournaments = tournaments.map(tournament => ({
            ...tournament,
            organizer_name: teamMap[tournament.organizer_team_id] || 'No Organizer',
            participant_count: tournamentParticipants[tournament.tour_id] || 0
        }));
        
        res.json(processedTournaments);
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new tournament
app.post('/api/tournaments', async (req, res) => {
    const { tour_name, tour_season, start_date, end_date, organizer_team_id, max_participants } = req.body;
    
    if (!tour_name || !start_date || !end_date) {
        return res.status(400).json({ error: 'Tournament name, start date, and end date are required' });
    }
    
    try {
        const { data, error } = await supabase
            .from('tournament')
            .insert([{ 
                tour_name, 
                tour_season, 
                start_date, 
                end_date, 
                organizer_team_id,
                max_participants: max_participants || 16
            }])
            .select();
            
        if (error) throw error;
        
        res.json({
            tour_id: data[0].tour_id,
            message: 'Tournament created successfully'
        });
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update tournament
app.put('/api/tournaments/:id', async (req, res) => {
    const tourId = req.params.id;
    const { tour_name, tour_season, start_date, end_date, organizer_team_id, max_participants } = req.body;
    
    if (!tour_name || !start_date || !end_date) {
        return res.status(400).json({ error: 'Tournament name, start date, and end date are required' });
    }
    
    try {
        const { error } = await supabase
            .from('tournament')
            .update({ 
                tour_name, 
                tour_season, 
                start_date, 
                end_date, 
                organizer_team_id,
                max_participants
            })
            .eq('tour_id', tourId);
            
        if (error) throw error;
        
        res.json({ message: 'Tournament updated successfully' });
    } catch (error) {
        console.error('Error updating tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete tournament
app.delete('/api/tournaments/:id', async (req, res) => {
    const tourId = req.params.id;
    
    try {
        const { error } = await supabase
            .from('tournament')
            .delete()
            .eq('tour_id', tourId);
            
        if (error) throw error;
        
        res.json({ message: 'Tournament deleted successfully' });
    } catch (error) {
        console.error('Error deleting tournament:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== MATCH ROUTES ====================

// Get matches with results
app.get('/api/matches', async (req, res) => {
    try {
        const { data: matches, error: matchesError } = await supabase
            .from('match_table')
            .select('*');
            
        if (matchesError) throw matchesError;
        
        const { data: tournaments, error: tournamentsError } = await supabase
            .from('tournament')
            .select('tour_id, tour_name');
            
        if (tournamentsError) throw tournamentsError;
        
        const { data: teams, error: teamsError } = await supabase
            .from('team')
            .select('team_id, team_name');
            
        if (teamsError) throw teamsError;
        
        const { data: results, error: resultsError } = await supabase
            .from('match_result')
            .select('*');
            
        if (resultsError) {
            console.log('No match results found, continuing...');
        }
        
        const tournamentMap = {};
        tournaments.forEach(tournament => {
            tournamentMap[tournament.tour_id] = tournament.tour_name;
        });
        
        const teamMap = {};
        teams.forEach(team => {
            teamMap[team.team_id] = team.team_name;
        });
        
        const resultMap = {};
        if (results) {
            results.forEach(result => {
                resultMap[result.match_id] = result;
            });
        }
        
        const processedMatches = matches.map(match => {
            const result = resultMap[match.match_id];
            return {
                ...match,
                tour_name: tournamentMap[match.tournament_id] || 'Unknown Tournament',
                team1_name: teamMap[match.team1_id] || 'Unknown Team',
                team2_name: teamMap[match.team2_id] || 'Unknown Team',
                team1_score: result?.team1_score || null,
                team2_score: result?.team2_score || null,
                winner_name: result?.winner_team_id ? teamMap[result.winner_team_id] : null,
                match_duration: result?.match_duration || null
            };
        });
        
        res.json(processedMatches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new match
app.post('/api/matches', async (req, res) => {
    const { tournament_id, round, scheduled_at, team1_id, team2_id } = req.body;
    
    if (!tournament_id || !round || !scheduled_at || !team1_id || !team2_id) {
        return res.status(400).json({ error: 'All match fields are required' });
    }
    
    if (team1_id === team2_id) {
        return res.status(400).json({ error: 'Team cannot play against itself' });
    }
    
    try {
        const { data, error } = await supabase
            .from('match_table')
            .insert([{ 
                tournament_id, 
                round, 
                scheduled_at, 
                team1_id, 
                team2_id,
                status: 'scheduled'
            }])
            .select();
            
        if (error) throw error;
        
        res.json({
            match_id: data[0].match_id,
            message: 'Match created successfully'
        });
    } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update match
app.put('/api/matches/:id', async (req, res) => {
    const matchId = req.params.id;
    const { tournament_id, round, scheduled_at, team1_id, team2_id, status } = req.body;
    
    if (!tournament_id || !round || !scheduled_at || !team1_id || !team2_id) {
        return res.status(400).json({ error: 'All match fields are required' });
    }
    
    if (team1_id === team2_id) {
        return res.status(400).json({ error: 'Team cannot play against itself' });
    }
    
    try {
        const { error } = await supabase
            .from('match_table')
            .update({ 
                tournament_id, 
                round, 
                scheduled_at, 
                team1_id, 
                team2_id,
                status: status || 'scheduled'
            })
            .eq('match_id', matchId);
            
        if (error) throw error;
        
        res.json({ message: 'Match updated successfully' });
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete match
app.delete('/api/matches/:id', async (req, res) => {
    const matchId = req.params.id;
    
    try {
        const { error } = await supabase
            .from('match_table')
            .delete()
            .eq('match_id', matchId);
            
        if (error) throw error;
        
        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        console.error('Error deleting match:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add match result
app.post('/api/matches/:id/result', async (req, res) => {
    const matchId = req.params.id;
    const { winner_team_id, team1_score, team2_score, match_duration, notes } = req.body;
    
    if (team1_score === undefined || team2_score === undefined) {
        return res.status(400).json({ error: 'Both team scores are required' });
    }
    
    try {
        await supabase
            .from('match_table')
            .update({ status: 'completed' })
            .eq('match_id', matchId);
        
        const { data, error } = await supabase
            .from('match_result')
            .upsert([{ 
                match_id: matchId,
                winner_team_id,
                team1_score,
                team2_score,
                match_duration,
                notes
            }])
            .select();
            
        if (error) throw error;
        
        res.json({
            result_id: data[0].result_id,
            message: 'Match result added successfully'
        });
    } catch (error) {
        console.error('Error adding match result:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== DROPDOWN DATA ROUTES ====================

// Get tournaments for dropdown
app.get('/api/tournaments/simple', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tournament')
            .select('tour_id, tour_name, tour_season')
            .order('tour_name');
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching simple tournaments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get teams for dropdown
app.get('/api/teams/simple', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('team')
            .select('team_id, team_name')
            .order('team_name');
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching simple teams:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== STATS ROUTES - FIXED ====================

// Get player statistics - WITH MATCH RESULTS
app.get('/api/stats/players', async (req, res) => {
    try {
        const { data: players, error: playersError } = await supabase
            .from('player')
            .select('*');
            
        if (playersError) throw playersError;
        
        const { data: teamMemberships, error: membersError } = await supabase
            .from('team_members')
            .select('player_id, team_id')
            .eq('is_active', true);
            
        if (membersError) throw membersError;
        
        // Get all matches
        const { data: matches, error: matchesError } = await supabase
            .from('match_table')
            .select('match_id, team1_id, team2_id, status');
            
        if (matchesError) throw matchesError;
        
        // Get match results
        const { data: results, error: resultsError } = await supabase
            .from('match_result')
            .select('match_id, winner_team_id');
            
        if (resultsError) {
            console.log('No match results found');
        }
        
        // Count teams per player
        const playerTeamCounts = {};
        teamMemberships.forEach(member => {
            playerTeamCounts[member.player_id] = (playerTeamCounts[member.player_id] || 0) + 1;
        });
        
        // Calculate matches and wins per player
        const playerMatches = {};
        const playerWins = {};
        
        if (matches && matches.length > 0) {
            matches.forEach(match => {
                const result = results?.find(r => r.match_id === match.match_id);
                
                // Get players from team1
                const team1Players = teamMemberships.filter(tm => tm.team_id === match.team1_id);
                team1Players.forEach(tm => {
                    playerMatches[tm.player_id] = (playerMatches[tm.player_id] || 0) + 1;
                    if (result && result.winner_team_id === match.team1_id) {
                        playerWins[tm.player_id] = (playerWins[tm.player_id] || 0) + 1;
                    }
                });
                
                // Get players from team2
                const team2Players = teamMemberships.filter(tm => tm.team_id === match.team2_id);
                team2Players.forEach(tm => {
                    playerMatches[tm.player_id] = (playerMatches[tm.player_id] || 0) + 1;
                    if (result && result.winner_team_id === match.team2_id) {
                        playerWins[tm.player_id] = (playerWins[tm.player_id] || 0) + 1;
                    }
                });
            });
        }
        
        const processedStats = players.map(player => {
            const totalMatches = playerMatches[player.player_id] || 0;
            const matchesWon = playerWins[player.player_id] || 0;
            const winRate = totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0;
            
            return {
                ...player,
                total_teams: playerTeamCounts[player.player_id] || 0,
                tournaments_played: 0, // Will calculate if tournament_participants data exists
                matches_won: matchesWon,
                total_matches: totalMatches,
                win_rate: winRate
            };
        });
        
        // Sort by win rate, then by total matches
        processedStats.sort((a, b) => {
            if (b.win_rate === a.win_rate) {
                return b.total_matches - a.total_matches;
            }
            return b.win_rate - a.win_rate;
        });
        
        res.json(processedStats);
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get team rankings - WITH MATCH RESULTS
app.get('/api/stats/teams', async (req, res) => {
    try {
        const { data: teams, error: teamsError } = await supabase
            .from('team')
            .select('*');
            
        if (teamsError) throw teamsError;
        
        const { data: captains, error: captainsError } = await supabase
            .from('player')
            .select('player_id, player_name');
            
        if (captainsError) throw captainsError;
        
        const { data: memberCounts, error: countsError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('is_active', true);
            
        if (countsError) throw countsError;
        
        // Get matches
        const { data: matches, error: matchesError } = await supabase
            .from('match_table')
            .select('match_id, team1_id, team2_id, status');
            
        if (matchesError) throw matchesError;
        
        // Get match results
        const { data: results, error: resultsError } = await supabase
            .from('match_result')
            .select('match_id, winner_team_id');
            
        if (resultsError) {
            console.log('No match results found');
        }
        
        // Process data
        const captainMap = {};
        captains.forEach(captain => {
            captainMap[captain.player_id] = captain.player_name;
        });
        
        const teamMemberCounts = {};
        memberCounts.forEach(member => {
            teamMemberCounts[member.team_id] = (teamMemberCounts[member.team_id] || 0) + 1;
        });
        
        // Calculate team match statistics
        const teamMatches = {};
        const teamWins = {};
        
        if (matches && matches.length > 0) {
            matches.forEach(match => {
                const result = results?.find(r => r.match_id === match.match_id);
                
                // Count matches for team1
                teamMatches[match.team1_id] = (teamMatches[match.team1_id] || 0) + 1;
                if (result && result.winner_team_id === match.team1_id) {
                    teamWins[match.team1_id] = (teamWins[match.team1_id] || 0) + 1;
                }
                
                // Count matches for team2
                teamMatches[match.team2_id] = (teamMatches[match.team2_id] || 0) + 1;
                if (result && result.winner_team_id === match.team2_id) {
                    teamWins[match.team2_id] = (teamWins[match.team2_id] || 0) + 1;
                }
            });
        }
        
        const processedStats = teams.map(team => {
            const totalMatches = teamMatches[team.team_id] || 0;
            const wins = teamWins[team.team_id] || 0;
            const losses = totalMatches - wins;
            const winPercentage = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
            
            return {
                ...team,
                captain_name: captainMap[team.captain_id] || null,
                member_count: teamMemberCounts[team.team_id] || 0,
                tournaments_joined: 0, // Will calculate if tournament_participants exists
                wins: wins,
                losses: losses,
                total_matches: totalMatches,
                win_percentage: winPercentage,
                rank: 0 // Will be set after sorting
            };
        });
        
        // Sort by win percentage, then by wins, then by total matches
        processedStats.sort((a, b) => {
            if (b.win_percentage === a.win_percentage) {
                if (b.wins === a.wins) {
                    return b.total_matches - a.total_matches;
                }
                return b.wins - a.wins;
            }
            return b.win_percentage - a.win_percentage;
        });
        
        // Add ranking
        processedStats.forEach((team, index) => {
            team.rank = index + 1;
        });
        
        res.json(processedStats);
    } catch (error) {
        console.error('Error fetching team rankings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get tournament summary - WITH MATCH STATISTICS
app.get('/api/stats/tournaments', async (req, res) => {
    try {
        const { data: tournaments, error: tournamentsError } = await supabase
            .from('tournament')
            .select('*');
            
        if (tournamentsError) throw tournamentsError;
        
        const { data: teams, error: teamsError } = await supabase
            .from('team')
            .select('team_id, team_name');
            
        if (teamsError) throw teamsError;
        
        // Get tournament participants
        const { data: participants, error: participantsError } = await supabase
            .from('tournament_participants')
            .select('tournament_id, team_id');
            
        if (participantsError) {
            console.log('No tournament participants found');
        }
        
        // Get matches per tournament
        const { data: matches, error: matchesError } = await supabase
            .from('match_table')
            .select('tournament_id, status');
            
        if (matchesError) throw matchesError;
        
        const teamMap = {};
        teams.forEach(team => {
            teamMap[team.team_id] = team.team_name;
        });
        
        // Count participants per tournament
        const tournamentParticipants = {};
        if (participants) {
            participants.forEach(participant => {
                tournamentParticipants[participant.tournament_id] = 
                    (tournamentParticipants[participant.tournament_id] || 0) + 1;
            });
        }
        
        // Count matches per tournament
        const tournamentMatches = {};
        const tournamentCompletedMatches = {};
        if (matches) {
            matches.forEach(match => {
                tournamentMatches[match.tournament_id] = (tournamentMatches[match.tournament_id] || 0) + 1;
                if (match.status === 'completed') {
                    tournamentCompletedMatches[match.tournament_id] = (tournamentCompletedMatches[match.tournament_id] || 0) + 1;
                }
            });
        }
        
        const processedStats = tournaments.map(tournament => {
            const totalMatches = tournamentMatches[tournament.tour_id] || 0;
            const completedMatches = tournamentCompletedMatches[tournament.tour_id] || 0;
            const participatingTeams = tournamentParticipants[tournament.tour_id] || 0;
            
            let status = 'Not Started';
            if (totalMatches > 0) {
                if (completedMatches === totalMatches && totalMatches > 0) {
                    status = 'Completed';
                } else if (completedMatches > 0) {
                    status = 'In Progress';
                } else {
                    status = 'Scheduled';
                }
            }
            
            const progressPercentage = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
            
            return {
                ...tournament,
                organizer: teamMap[tournament.organizer_team_id] || 'No Organizer',
                participating_teams: participatingTeams,
                total_matches: totalMatches,
                completed_matches: completedMatches,
                tournament_status: status,
                progress_percentage: progressPercentage
            };
        });
        
        // Sort by start date (newest first)
        processedStats.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        
        res.json(processedStats);
    } catch (error) {
        console.error('Error fetching tournament summary:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== PAGE ROUTES ====================

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tournament.html'));
});

// Serve ERD page
app.get('/erd', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'erd.html'));
});

// Serve Stats page
app.get('/stats', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Tournament Server running at http://localhost:${port}`);
    console.log(`🏆 Tournament Management System Ready!`);
    console.log(`📊 Database Schema available at: http://localhost:${port}/erd`);
    console.log(`📈 Statistics available at: http://localhost:${port}/stats`);
});

/*
TBD project/
├── server.js          (Backend API)
├── public/
│   └── index.html     (Frontend)
├── package.json
└── node_modules/
*/