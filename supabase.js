// ==========================================
// ARROWSGO - SUPABASE CLOUD BACKEND CLIENT
// ==========================================

const SUPABASE_URL = "https://btuxqfkomiqbwzlgyfit.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dXhxZmtvbWlxYnd6bGd5Zml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNDY1OTgsImV4cCI6MjEwNTcyMjU5OH0.CBu7W2KCUiLf0NDcTli51zvAFiKZKkWabmQDxG4jZAc";

class CloudBackend {
  constructor() {
    this.playerId = localStorage.getItem('arrowgo_player_id');
    this.username = localStorage.getItem('arrowgo_username');
    this.profile = null;
    this.isOnline = false;
  }

  getHeaders() {
    return {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  async init() {
    if (!this.playerId) {
      this.playerId = 'usr_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      this.username = 'Archer_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('arrowgo_player_id', this.playerId);
      localStorage.setItem('arrowgo_username', this.username);
    }

    try {
      // 1. Check if profile exists
      const res = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?id=eq.${this.playerId}&select=*`, {
        headers: this.getHeaders()
      });
      const data = await res.json();

      if (data && data.length > 0) {
        this.profile = data[0];
      } else {
        // 2. Create profile
        const newProf = {
          id: this.playerId,
          username: this.username,
          high_score: 0,
          xp: 0,
          elo_rating: 1000,
          rank_tier: "Bronze",
          arrow_color_hex: "#00FFCC",
          games_played: 0,
          wins: 0,
          current_level: 1,
          updated_at: new Date().toISOString()
        };

        const createRes = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles`, {
          method: 'POST',
          headers: { ...this.getHeaders(), 'Prefer': 'return=representation' },
          body: JSON.stringify(newProf)
        });

        const created = await createRes.json();
        this.profile = Array.isArray(created) ? created[0] : newProf;
      }

      this.isOnline = true;
      console.log("[Supabase] Player profile loaded:", this.profile);
      return this.profile;
    } catch (err) {
      console.warn("[Supabase] Cloud offline, using local profile fallback:", err);
      this.profile = {
        id: this.playerId,
        username: this.username,
        high_score: parseInt(localStorage.getItem('arrowgo_high_score') || '0', 10),
        xp: 150,
        elo_rating: 1050,
        rank_tier: "Bronze",
        current_level: 1
      };
      return this.profile;
    }
  }

  async submitScore(score, isWin = true, xpEarned = 50) {
    if (this.profile) {
      if (score > this.profile.high_score) {
        this.profile.high_score = score;
        localStorage.setItem('arrowgo_high_score', score);
      }
      this.profile.games_played = (this.profile.games_played || 0) + 1;
      if (isWin) this.profile.wins = (this.profile.wins || 0) + 1;
      this.profile.xp = (this.profile.xp || 0) + xpEarned;
    }

    if (!this.isOnline) return this.profile;

    try {
      // Call Supabase RPC
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_arrow_match_result`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          player_id: this.playerId,
          match_score: score,
          is_win: isWin,
          xp_earned: xpEarned
        })
      });

      // Refetch fresh profile
      const res = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?id=eq.${this.playerId}&select=*`, {
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (data && data.length > 0) this.profile = data[0];
    } catch (err) {
      console.error("[Supabase] Score submit error:", err);
    }

    return this.profile;
  }

  async getLeaderboard(limit = 20) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?select=*&order=high_score.desc&limit=${limit}`, {
        headers: this.getHeaders()
      });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("[Supabase] Get leaderboard error:", err);
      return [];
    }
  }
}

window.cloudBackend = new CloudBackend();
