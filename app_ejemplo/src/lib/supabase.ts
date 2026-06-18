import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://qzqjyebgqdsbssujyfia.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImU3ZGNjY2ZhLWNkYjYtNGMzOC05NDExLTY0MzAzNTE3YjE5YyJ9.eyJwcm9qZWN0SWQiOiJxenFqeWViZ3Fkc2Jzc3VqeWZpYSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgwMjY1NzY2LCJleHAiOjIwOTU2MjU3NjYsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.5irSjJixlwNtqWFHTcymfz9PFEu8K1Nfb4zyIVJ_W5E';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };