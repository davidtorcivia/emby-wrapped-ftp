import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const musicDir = path.join(process.cwd(), 'static', 'music');

    try {
        if (!fs.existsSync(musicDir)) {
            return json({ tracks: [] });
        }

        const files = fs.readdirSync(musicDir);
        const tracks = files
            .filter(file => file.endsWith('.mp3')) // Only MP3s
            .map(file => `/api/music/${encodeURIComponent(file)}`);

        return json({ tracks });
    } catch (error) {
        console.error('Error reading music directory:', error);
        return json({ tracks: [] });
    }
}
