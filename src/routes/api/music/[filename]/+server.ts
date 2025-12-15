import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';

export const GET: RequestHandler = async ({ params }) => {
    const filename = params.filename;

    // Security: only allow alphanumeric, spaces, parentheses, dashes, and .mp3 extension
    if (!filename || !/^[\w\s().-]+\.mp3$/i.test(filename)) {
        throw error(400, 'Invalid filename');
    }

    // Look in static/music directory
    const musicDir = path.join(process.cwd(), 'static', 'music');
    const filePath = path.join(musicDir, filename);

    // Security: ensure path doesn't escape music directory
    const realPath = path.resolve(filePath);
    const realMusicDir = path.resolve(musicDir);
    if (!realPath.startsWith(realMusicDir)) {
        throw error(403, 'Forbidden');
    }

    if (!fs.existsSync(filePath)) {
        throw error(404, 'File not found');
    }

    try {
        const buffer = fs.readFileSync(filePath);

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Accept-Ranges': 'bytes'
            }
        });
    } catch (e) {
        console.error('Error serving music file:', e);
        throw error(500, 'Failed to read file');
    }
};
