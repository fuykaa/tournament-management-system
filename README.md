# 🏆 Tournament Management System

A comprehensive web-based tournament management system built with Node.js, Express, and Supabase.

## ✨ Features

- 👤 **Player Management** - Add, edit, delete players
- 👥 **Team Management** - Create teams with captains and members
- 🏆 **Tournament Organization** - Schedule and manage tournaments
- ⚔️ **Match Management** - Schedule matches and record results
- 📊 **Statistics Dashboard** - View player/team performance analytics
- 🗂️ **ERD Visualization** - Interactive database schema diagram

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Custom CSS with gradients and animations
- **Diagrams**: Mermaid.js for ERD visualization

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tournament-management-system.git
   cd tournament-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key
   - Update the credentials in `server.js`:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

4. **Create Database Tables**
   Run these SQL commands in your Supabase SQL editor:
   ```sql
   -- (Include your table creation scripts here)
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Pages

- **Main App**: `http://localhost:3000/` - Tournament management interface
- **Statistics**: `http://localhost:3000/stats` - Analytics dashboard  
- **ERD**: `http://localhost:3000/erd` - Database schema visualization

## 🗄️ Database Schema

The system uses 7 main tables:
- `player` - Player information
- `team` - Team details with captain
- `team_members` - Many-to-many relationship between players and teams
- `tournament` - Tournament information
- `tournament_participants` - Teams participating in tournaments
- `match_table` - Match scheduling
- `match_result` - Match outcomes and scores

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Supabase for the excellent backend-as-a-service
- Mermaid.js for beautiful diagram rendering
- The open-source community for inspiration

## 📞 Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/tournament-management-system](https://github.com/yourusername/tournament-management-system)