
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('Testing Supabase Connection...')
console.log('URL:', supabaseUrl)
// Don't log full key for security, just first few chars
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    try {
        console.log('1. Testing Auth Service (Health Check)...')
        const { data: authData, error: authError } = await supabase.auth.getSession()

        if (authError) {
            console.error('Auth Service Failed:', authError)
        } else {
            console.log('Auth Service: OK')
        }

        console.log('2. Testing Database (Profiles Table)...')
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })

        if (error) {
            console.error('Database Request Failed.')
            console.error('Code:', error.code)
            console.error('Message:', error.message)
            console.error('Hint:', error.hint)
            console.error('Details:', error.details)
        } else {
            console.log('Database Connection Successful!')
        }
    } catch (err) {
        console.error('Unexpected Runtime Error:', err)
    }
}

testConnection()
