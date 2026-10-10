-- ============================================================================
-- Arrow-GO Database Schema & Backend Architecture
-- Backend: Supabase (PostgreSQL 15+)
-- Project Ref: btuxqfkomiqbwzlgyfit
-- ============================================================================

-- 1. Create Arrow Profiles Table
CREATE TABLE IF NOT EXISTS public.arrow_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    high_score INT DEFAULT 0,
    xp INT DEFAULT 0,
    elo_rating INT DEFAULT 1000,
    rank_tier TEXT DEFAULT 'Bronze',
    arrow_color_hex TEXT DEFAULT '#00FFCC',
    games_played INT DEFAULT 0,
    wins INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Performance Indexes for Global Leaderboard & Elo Lookups
CREATE INDEX IF NOT EXISTS idx_arrow_high_score ON public.arrow_profiles (high_score DESC);
CREATE INDEX IF NOT EXISTS idx_arrow_elo ON public.arrow_profiles (elo_rating DESC);

-- 3. Row-Level Security (RLS) Policies
ALTER TABLE public.arrow_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public arrow profiles viewable') THEN
        CREATE POLICY "Public arrow profiles viewable" 
        ON public.arrow_profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own arrow profile') THEN
        CREATE POLICY "Users update own arrow profile" 
        ON public.arrow_profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own arrow profile') THEN
        CREATE POLICY "Users insert own arrow profile" 
        ON public.arrow_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 4. Stored Procedure (RPC) for Atomic Score Submission & Elo Ranking
CREATE OR REPLACE FUNCTION public.submit_arrow_match_result(
    player_id UUID,
    match_score INT,
    is_win BOOLEAN,
    xp_earned INT
)
RETURNS TABLE (
    new_high_score INT,
    new_elo INT,
    new_rank TEXT,
    new_xp INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    curr_score INT;
    curr_elo INT;
    curr_xp INT;
    elo_delta INT := 0;
    calc_rank TEXT;
BEGIN
    SELECT high_score, elo_rating, xp 
    INTO curr_score, curr_elo, curr_xp
    FROM public.arrow_profiles 
    WHERE id = player_id;

    -- Calculate Elo Delta: +25 for win, -15 for defeat
    IF is_win THEN
        elo_delta := 25;
    ELSE
        elo_delta := -15;
    END IF;

    curr_elo := GREATEST(0, COALESCE(curr_elo, 1000) + elo_delta);
    curr_xp := COALESCE(curr_xp, 0) + xp_earned;
    curr_score := GREATEST(COALESCE(curr_score, 0), match_score);

    -- Dynamic Elo Rank Tier
    IF curr_elo >= 2500 THEN
        calc_rank := 'Champion';
    ELSIF curr_elo >= 2000 THEN
        calc_rank := 'Diamond';
    ELSIF curr_elo >= 1500 THEN
        calc_rank := 'Gold';
    ELSIF curr_elo >= 1200 THEN
        calc_rank := 'Silver';
    ELSE
        calc_rank := 'Bronze';
    END IF;

    UPDATE public.arrow_profiles
    SET 
        high_score = curr_score,
        elo_rating = curr_elo,
        xp = curr_xp,
        rank_tier = calc_rank,
        games_played = games_played + 1,
        wins = CASE WHEN is_win THEN wins + 1 ELSE wins END,
        updated_at = timezone('utc'::text, now())
    WHERE id = player_id;

    RETURN QUERY 
    SELECT curr_score, curr_elo, calc_rank, curr_xp;
END;
$$;
