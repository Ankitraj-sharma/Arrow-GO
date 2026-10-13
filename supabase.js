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

    // 1. Check if user is logged in via Supabase Auth (OAuth/Email)
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
          } else if (!this.currentUser || !this.currentUser.isPlayerTag) {
            this.currentUser = null;
            this.profile = null;
            window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
          }
        });
      } catch (err) {
        console.warn("[Auth] Session check fallback:", err);
      }
    }

    // 2. Check if user logged in via Instant Player Tag in localStorage
    const savedUser = localStorage.getItem('arrowgo_logged_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.id && parsed.username) {
          const headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          };
          const res = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?id=eq.${encodeURIComponent(parsed.id)}&select=*`, { headers });
          const data = await res.json();
          if (data && data.length > 0) {
            this.profile = data[0];
            this.currentUser = { id: this.profile.id, username: this.profile.username, isPlayerTag: true };
            return this.profile;
          }
        }
      } catch (e) {
        console.warn("[Saved session restore error]:", e);
      }
    }

    // Unauthenticated Guest state
    this.currentUser = null;
    this.profile = null;
    return null;
  }

  // --- INSTANT PLAYER TAG LOGIN (NO EMAIL CONFIRMATION NEEDED) ---
  async loginWithPlayerTag(username, passcode) {
    if (!username || !username.trim()) {
      return { success: false, error: 'Please enter a player username' };
    }
    const cleanUname = username.trim();
    const playerId = 'player_' + cleanUname.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const pinRaw = passcode ? passcode.trim() : '';
    const pinHash = pinRaw ? ('pin_' + btoa(pinRaw)) : 'pin_none';

    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };

    try {
      // 1. Check if player already exists in Supabase
      const res = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?id=eq.${encodeURIComponent(playerId)}&select=*`, { headers });
      const data = await res.json();

      if (data && data.length > 0) {
        const existing = data[0];
        // Verify PIN if existing player set a pin (and it's not none/0000)
        if (existing.arrow_color_hex && existing.arrow_color_hex.startsWith('pin_')) {
          const stored = existing.arrow_color_hex;
          if (stored !== 'pin_none' && stored !== 'pin_0000') {
            const pinB64 = pinRaw ? ('pin_' + btoa(pinRaw)) : '';
            const pinDirect = pinRaw ? ('pin_' + pinRaw) : '';
            if (stored !== pinB64 && stored !== pinDirect && pinRaw !== '') {
              return { success: false, error: 'Incorrect PIN for this username. Please enter the correct PIN or choose another nickname.' };
            }
          }
        }
        this.profile = existing;
      } else {
        // 2. Create new profile in Supabase
        const newProf = {
          id: playerId,
          username: cleanUname,
          high_score: parseInt(localStorage.getItem('arrowgo_high_score') || '0', 10),
          xp: 100,
          elo_rating: 1000,
          rank_tier: "Bronze",
          arrow_color_hex: pinHash,
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

      this.currentUser = {
        id: this.profile.id,
        username: this.profile.username,
        email: null,
        isPlayerTag: true
      };

      // Save session in localStorage so they stay logged in on refresh
      localStorage.setItem('arrowgo_logged_user', JSON.stringify({
        id: this.profile.id,
        username: this.profile.username,
        pinHash: pinHash
      }));

      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: this.profile }));
      return { success: true, profile: this.profile };
    } catch (err) {
      console.error("[Login Error]:", err);
      return { success: false, error: err.message || 'Login failed' };
    }
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
      return { error: { message: "Supabase client is initializing. Please retry in a moment." } };
    }

    try {
      // Check if Google provider is enabled in this Supabase project
      try {
        const settingsRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
          headers: { 'apikey': SUPABASE_ANON_KEY }
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings?.external?.google === false) {
            const friendlyMsg = "Google Login requires Google Cloud OAuth setup in Supabase.\n\n👉 Enter your Player Name above to play instantly!";
            return { error: { message: friendlyMsg, isProviderDisabled: true } };
          }
        }
      } catch (checkErr) {
        console.warn("[Provider check error]:", checkErr);
      }

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
      return { error: err };
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
      if (data.user && data.session) {
        this.currentUser = data.user;
        await this.loadOrCreateProfile(data.user.id, username || email.split('@')[0]);
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: this.profile }));
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
    localStorage.removeItem('arrowgo_logged_user');
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
  async submitScore(score, isWin = true, xpEarned = 50, levelNum = null) {
    const prevLocalHigh = parseInt(localStorage.getItem('arrowgo_high_score') || '0', 10);
    if (score > prevLocalHigh) {
      localStorage.setItem('arrowgo_high_score', score);
    }
    const currentLocalGames = parseInt(localStorage.getItem('arrowgo_guest_games') || '0', 10) + 1;
    localStorage.setItem('arrowgo_guest_games', currentLocalGames);

    if (isWin) {
      const currentLocalWins = parseInt(localStorage.getItem('arrowgo_guest_wins') || '0', 10) + 1;
      localStorage.setItem('arrowgo_guest_wins', currentLocalWins);
      if (levelNum) {
        const currentLocalLevel = Math.max(parseInt(localStorage.getItem('arrowgo_guest_level') || '1', 10), levelNum + 1);
        localStorage.setItem('arrowgo_guest_level', currentLocalLevel);
      }
    }

    if (!this.currentUser || !this.profile) {
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
      return null;
    }

    if (score > (this.profile.high_score || 0)) {
      this.profile.high_score = score;
      localStorage.setItem('arrowgo_high_score', score);
    }
    this.profile.games_played = (this.profile.games_played || 0) + 1;
    if (isWin) this.profile.wins = (this.profile.wins || 0) + 1;
    this.profile.xp = (this.profile.xp || 0) + xpEarned;
    if (levelNum) {
      this.profile.current_level = Math.max(this.profile.current_level || 1, levelNum + 1);
    }

    // Call Supabase RPC
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_arrow_match_result`, {
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
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          this.profile.high_score = data[0].new_high_score;
          this.profile.elo_rating = data[0].new_elo;
          this.profile.rank_tier = data[0].new_rank;
          this.profile.xp = data[0].new_xp;
        }
      }
    } catch (e) {
      console.warn("RPC update logged locally:", e);
    }

    // Also persist level to Supabase if increased
    if (levelNum && this.profile.id) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?id=eq.${encodeURIComponent(this.profile.id)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            current_level: this.profile.current_level,
            updated_at: new Date().toISOString()
          })
        });
      } catch (lvlErr) {
        console.warn("[Level sync error]:", lvlErr);
      }
    }

    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: this.profile }));
    return this.profile;
  }

  // --- GET LEADERBOARD ---
  async getLeaderboard(limit = 50) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?select=*&order=high_score.desc,elo_rating.desc&limit=${limit}`, {
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
    if (!this.currentUser && !this.profile) {
      // Guest profile from local storage
      const localHighScore = parseInt(localStorage.getItem('arrowgo_high_score') || '0', 10);
      const localGames = parseInt(localStorage.getItem('arrowgo_guest_games') || '0', 10);
      const localWins = parseInt(localStorage.getItem('arrowgo_guest_wins') || '0', 10);
      const localLevel = parseInt(localStorage.getItem('arrowgo_guest_level') || '1', 10);
      return {
        id: 'guest',
        isGuest: true,
        email: null,
        username: 'Guest Player',
        tier: 'BRONZE',
        high_score: localHighScore,
        elo: 1000,
        xp: 100,
        games_played: localGames,
        wins: localWins,
        current_level: localLevel,
        arrow_color_hex: localStorage.getItem('arrowgo_arrow_color') || '#42d3e8'
      };
    }
    return {
      id: this.profile?.id || this.currentUser?.id,
      isGuest: false,
      isPlayerTag: !!this.currentUser?.isPlayerTag,
      isGoogle: !this.currentUser?.isPlayerTag && !!this.currentUser?.email,
      email: this.currentUser?.email || null,
      username: this.profile?.username || this.currentUser?.user_metadata?.username || this.currentUser?.email?.split('@')[0] || 'Player',
      tier: (this.profile?.rank_tier || 'BRONZE').toUpperCase(),
      high_score: this.profile?.high_score || 0,
      elo: this.profile?.elo_rating || 1000,
      xp: this.profile?.xp || 100,
      games_played: this.profile?.games_played || 0,
      wins: this.profile?.wins || 0,
      current_level: this.profile?.current_level || 1,
      arrow_color_hex: (this.profile?.arrow_color_hex && !this.profile.arrow_color_hex.startsWith('pin_')) ? this.profile.arrow_color_hex : (localStorage.getItem('arrowgo_arrow_color') || '#42d3e8'),
      avatar_url: this.currentUser?.user_metadata?.avatar_url || null,
      created_at: this.profile?.updated_at || null
    };
  }

  // --- ACHIEVEMENTS SYSTEM ---
  getAchievements(stats) {
    const s = stats || this.getCurrentUser();
    return [
      {
        id: 'first_win',
        icon: '🎯',
        title: 'First Strike',
        desc: 'Solve and clear your first puzzle maze',
        unlocked: (s.wins >= 1 || s.current_level >= 2 || s.games_played >= 1),
        progress: (s.wins >= 1 || s.current_level >= 2 || s.games_played >= 1) ? '1/1' : '0/1'
      },
      {
        id: 'score_200',
        icon: '⚡',
        title: 'Score Hunter',
        desc: 'Achieve a High Score of 200 points or more',
        unlocked: s.high_score >= 200,
        progress: `${Math.min(s.high_score, 200)}/200`
      },
      {
        id: 'level_5',
        icon: '🧠',
        title: 'Path Finder',
        desc: 'Reach Level 5 in any game mode',
        unlocked: s.current_level >= 5,
        progress: `${Math.min(s.current_level, 5)}/5`
      },
      {
        id: 'level_10',
        icon: '🔮',
        title: 'Maze Master',
        desc: 'Reach Level 10 or higher',
        unlocked: s.current_level >= 10,
        progress: `${Math.min(s.current_level, 10)}/10`
      },
      {
        id: 'elo_1050',
        icon: '🛡️',
        title: 'Bronze Veteran',
        desc: 'Climb above 1,050 Elo competitive rating',
        unlocked: s.elo >= 1050,
        progress: `${Math.min(s.elo, 1050)}/1050`
      },
      {
        id: 'elo_1200',
        icon: '⚔️',
        title: 'Silver Champion',
        desc: 'Reach 1,200+ Elo competitive rating',
        unlocked: s.elo >= 1200,
        progress: `${Math.min(s.elo, 1200)}/1200`
      },
      {
        id: 'games_5',
        icon: '🔥',
        title: 'Active Archer',
        desc: 'Play at least 5 matches',
        unlocked: s.games_played >= 5,
        progress: `${Math.min(s.games_played, 5)}/5`
      },
      {
        id: 'wins_5',
        icon: '👑',
        title: 'Victory Streak',
        desc: 'Win 5 or more games total',
        unlocked: s.wins >= 5,
        progress: `${Math.min(s.wins, 5)}/5`
      }
    ];
  }

  // --- UPDATE PROFILE CUSTOMIZATION ---
  async updateProfileCustomization(updates) {
    if (!this.profile) {
      if (updates.arrow_color_hex) {
        localStorage.setItem('arrowgo_arrow_color', updates.arrow_color_hex);
      }
      return { success: true, profile: this.getCurrentUser() };
    }

    try {
      const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/arrow_profiles?id=eq.${encodeURIComponent(this.profile.id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          this.profile = { ...this.profile, ...data[0] };
        } else {
          this.profile = { ...this.profile, ...updates };
        }
        if (updates.arrow_color_hex) {
          localStorage.setItem('arrowgo_arrow_color', updates.arrow_color_hex);
        }
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: this.profile }));
        return { success: true, profile: this.profile };
      }
      return { success: false, error: 'Failed to update profile' };
    } catch (err) {
      console.error("[Profile Update Error]:", err);
      return { success: false, error: err.message };
    }
  }

  // --- SUBMIT LEVEL COMPLETE ---
  async submitLevelComplete(tier, levelNum, score, stars = 3) {
    this.saveLevelStars(tier, levelNum, stars);
    const xpEarned = stars * 35;
    return await this.submitScore(score, true, xpEarned, levelNum);
  }
}

window.supabaseService = new SupabaseService();
