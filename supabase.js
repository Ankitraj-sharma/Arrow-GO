// =========================================================================
// SUPABASE BACKEND - AUTHENTICATION (GOOGLE + EMAIL), PROFILES & LEADERBOARD
// =========================================================================

const SUPABASE_URL = "https://btuxqfkomiqbwzlgyfit.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0dXhxZmtvbWlxYnd6bGd5Zml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNDY1OTgsImV4cCI6MjEwNTcyMjU5OH0.CBu7W2KCUiLf0NDcTli51zvAFiKZKkWabmQDxG4jZAc";

class SupabaseService {
  constructor() {
    this.client = null;
    this.currentUser = null;
    this.profile = null;
    this.initClient();
  }

  initClient() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  async init() {
    this.initClient();

    // Check if user is logged in
    if (this.client) {
      try {
        const { data: { session } } = await this.client.auth.getSession();
        if (session && session.user) {
          this.currentUser = session.user;
          await this.loadOrCreateProfile(session.user.id, session.user.user_metadata?.username || session.user.email?.split('@')[0]);
          return this.profile;
        }

        // Listen for OAuth callbacks (e.g. Google Login redirect)
        this.client.auth.onAuthStateChange(async (event, session) => {
          if (session && session.user) {
            this.currentUser = session.user;
            await this.loadOrCreateProfile(session.user.id, session.user.user_metadata?.username || session.user.email?.split('@')[0]);
            window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: this.profile }));
          } else {
            this.currentUser = null;
          }
        });
      } catch (err) {
        console.warn("[Auth] Session check fallback:", err);
      }
    }

    // Fallback to Guest Account
    return await this.initGuestProfile();
  }

  async initGuestProfile() {
    let guestId = localStorage.getItem('arrowgo_guest_id');
    let guestName = localStorage.getItem('arrowgo_guest_name');

    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      guestName = 'Player_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('arrowgo_guest_id', guestId);
      localStorage.setItem('arrowgo_guest_name', guestName);
    }

    return await this.loadOrCreateProfile(guestId, guestName);
  }

  async loadOrCreateProfile(userId, defaultUsername) {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };

    try {
      // 1. Fetch profile
      const res = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?id=eq.${userId}&select=*`, { headers });
      const data = await res.json();

      if (data && data.length > 0) {
        this.profile = data[0];
      } else {
        // 2. Insert new profile
        const newProf = {
          id: userId,
          username: defaultUsername || 'Archer_101',
          high_score: 0,
          xp: 100,
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
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(newProf)
        });

        const created = await createRes.json();
        this.profile = Array.isArray(created) ? created[0] : newProf;
      }
    } catch (err) {
      console.warn("[Supabase] Using local storage profile:", err);
      this.profile = {
        id: userId,
        username: defaultUsername,
        high_score: parseInt(localStorage.getItem('arrowgo_high_score') || '0', 10),
        xp: 150,
        elo_rating: 1050,
        rank_tier: "Bronze",
        current_level: 1
      };
    }

    return this.profile;
  }

  // --- GOOGLE SIGN IN ---
  async signInWithGoogle() {
    this.initClient();
    if (!this.client) {
      alert("Supabase client is initializing. Please retry in a moment.");
      return;
    }

    try {
      // Clean redirect URL without hashes or query parameters
      const redirectUrl = window.location.origin + window.location.pathname;

      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("[Google Auth Error]:", err);
      alert("Google Sign-In note: " + (err.message || "Please ensure Google Provider is enabled in Supabase console."));
    }
  }

  // --- EMAIL SIGN UP ---
  async signUpWithEmail(email, password, username) {
    this.initClient();
    if (!this.client) return;

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (error) throw error;
      if (data.user) {
        this.currentUser = data.user;
        await this.loadOrCreateProfile(data.user.id, username || email.split('@')[0]);
      }
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // --- EMAIL SIGN IN ---
  async signInWithEmail(email, password) {
    this.initClient();
    if (!this.client) return;

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (data.user) {
        this.currentUser = data.user;
        await this.loadOrCreateProfile(data.user.id, data.user.user_metadata?.username || email.split('@')[0]);
      }
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // --- SIGN OUT ---
  async signOut() {
    if (this.client) {
      await this.client.auth.signOut();
    }
    this.currentUser = null;
    return await this.initGuestProfile();
  }

  // --- SUBMIT MATCH SCORE & ELO ---
  async submitScore(score, isWin = true, xpEarned = 50) {
    if (!this.profile) return;

    if (score > this.profile.high_score) {
      this.profile.high_score = score;
      localStorage.setItem('arrowgo_high_score', score);
    }
    this.profile.games_played = (this.profile.games_played || 0) + 1;
    if (isWin) this.profile.wins = (this.profile.wins || 0) + 1;
    this.profile.xp = (this.profile.xp || 0) + xpEarned;

    // Recalculate Rank Tier
    if (this.profile.elo_rating >= 2000) this.profile.rank_tier = "Champion";
    else if (this.profile.elo_rating >= 1500) this.profile.rank_tier = "Diamond";
    else if (this.profile.elo_rating >= 1200) this.profile.rank_tier = "Gold";
    else if (this.profile.elo_rating >= 1000) this.profile.rank_tier = "Silver";
    else this.profile.rank_tier = "Bronze";

    // Call Supabase RPC
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_arrow_match_result`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_id: this.profile.id,
          match_score: score,
          is_win: isWin,
          xp_earned: xpEarned
        })
      });
    } catch (e) {
      console.warn("RPC update logged locally:", e);
    }

    return this.profile;
  }

  // --- GET LEADERBOARD ---
  async getLeaderboard(limit = 50) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?select=*&order=high_score.desc&limit=${limit}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("[Leaderboard Fetch Error]:", err);
      return [];
    }
  }

  // --- LEVEL STARS PROGRESS ---
  saveLevelStars(tier, levelId, stars) {
    const key = `arrowgo_stars_${tier}_${levelId}`;
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    if (stars > prev) {
      localStorage.setItem(key, stars);
    }
  }

  getLevelStars(tier, levelId) {
    return parseInt(localStorage.getItem(`arrowgo_stars_${tier}_${levelId}`) || '0', 10);
  }

  // --- GET CURRENT USER PROFILE ---
  getCurrentUser() {
    if (this.profile) {
      return {
        id: this.profile.id,
        username: this.profile.username || 'Archer_101',
        tier: this.profile.rank_tier || 'BRONZE',
        high_score: this.profile.high_score || 0,
        elo: this.profile.elo_rating || 1000
      };
    }
    if (this.currentUser) {
      return {
        id: this.currentUser.id,
        username: this.currentUser.user_metadata?.username || this.currentUser.email?.split('@')[0] || 'Archer_101',
        tier: 'BRONZE',
        high_score: 0,
        elo: 1000
      };
    }
    return null;
  }

  // --- SUBMIT LEVEL COMPLETE ---
  async submitLevelComplete(tier, levelNum, score) {
    this.saveLevelStars(tier, levelNum, 3);
    return await this.submitScore(score, true, 50);
  }
}

window.supabaseService = new SupabaseService();
