-- Supabase Database Schema for Schedule App
-- Run this in your Supabase SQL editor

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Default Schedule',
    weekdays JSONB NOT NULL DEFAULT '{}',
    specific_dates JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policies
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Users can only see their own schedules
CREATE POLICY "Users can view own schedules" ON schedules
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own schedules
CREATE POLICY "Users can insert own schedules" ON schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own schedules
CREATE POLICY "Users can update own schedules" ON schedules
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own schedules
CREATE POLICY "Users can delete own schedules" ON schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_schedules_updated_at 
    BEFORE UPDATE ON schedules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_updated_at ON schedules(updated_at);
