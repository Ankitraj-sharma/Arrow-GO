// =========================================================================
// SUPABASE BACKEND - AUTHENTICATION (GOOGLE + EMAIL), PROFILES & LEADERBOARD
// =========================================================================

const SUPABASE_URL = "https://rpyckuskyuahthjlrtky.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweWNrdXNreXVhaHRoamxydGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDczMzMsImV4cCI6MjEwNzQyMzMzM30.XCSvZJzKKkmgDmghJu135P_Ltimx_BdFDrNkG6lQ49U";

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
            this.profile = null;
            window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
          }
        });
      } catch (err) {
        console.warn("[Auth] Session check fallback:", err);
      }
    }

    // Unauthenticated Guest state
    this.currentUser = null;
    this.profile = null;
    return null;
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
        if (data.session) {
          this.currentUser = data.user;
          await this.loadOrCreateProfile(data.user.id, username || email.split('@')[0]);
          window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: this.profile }));
        }
      }
      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // --- EMAIL SIGN IN ---
  async signInWithEmail(email, password) {
    this.initClient();
    if (!this.client) return { success: false, error: 'Database initializing. Please retry in a moment.' };

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (data.user) {
        this.currentUser = data.user;
        await this.loadOrCreateProfile(data.user.id, data.user.user_metadata?.username || email.split('@')[0]);
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: this.profile }));
      }
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // --- SIGN OUT ---
  async signOut() {
    if (this.client) {
      try {
        await this.client.auth.signOut();
      } catch (err) {
        console.warn("[SignOut Error]:", err);
      }
    }
    this.currentUser = null;
    this.profile = null;
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
    return null;
  }

  // --- SUBMIT MATCH SCORE & ELO ---
  async submitScore(score, isWin = true, xpEarned = 50) {
    if (!this.currentUser || !this.profile) {
      // Unauthenticated Guest: save high score locally
      const prev = parseInt(localStorage.getItem('arrowgo_high_score') || '0', 10);
      if (score > prev) localStorage.setItem('arrowgo_high_score', score);
      return null;
    }

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

  // --- CHECK IF USER IS AUTHENTICATED ---
  isLoggedIn() {
    return !!this.currentUser;
  }

  // --- GET CURRENT USER PROFILE ---
  getCurrentUser() {
    if (!this.currentUser) return null;
    return {
      id: this.currentUser.id,
      email: this.currentUser.email,
      username: this.profile?.username || this.currentUser.user_metadata?.username || this.currentUser.email?.split('@')[0] || 'Player',
      tier: this.profile?.rank_tier || 'BRONZE',
      high_score: this.profile?.high_score || 0,
      elo: this.profile?.elo_rating || 1000
    };
  }

  // --- SUBMIT LEVEL COMPLETE ---
  async submitLevelComplete(tier, levelNum, score) {
    this.saveLevelStars(tier, levelNum, 3);
    return await this.submitScore(score, true, 50);
  }
}

window.supabaseService = new SupabaseService();
