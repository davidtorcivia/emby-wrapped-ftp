# Emby Wrapped

A beautiful, Spotify Wrapped-style year-in-review experience for your Emby media server. See your viewing stats, top shows, favorite genres, and more in an interactive, animated presentation.

![Emby Wrapped](https://img.shields.io/badge/Emby-Wrapped-1db954?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)

## Screenshots

<p align="center">
  <img src="https://images.disinfo.zone/uploads/cUxT3h3VqZUrNWHnFaJl2S7MVNkFDZA11ZndwHET.jpg" width="250" alt="Top Shows" />
  <img src="https://images.disinfo.zone/uploads/SNPzSbEtNqFrd4CmQSBvbtUhe9QFP4Hjuz8kYD8s.jpg" width="250" alt="Viewing Stats" />
  <img src="https://images.disinfo.zone/uploads/FI4PJKqYrcASPtrKS64KO4QC87jcu47KjT4BkFK6.jpg" width="250" alt="Genre Breakdown" />
</p>

## Features

- **Total Watch Time** - See how many days/hours you've spent watching
- **Top Shows and Movies** - Your most-watched content with beautiful poster displays
- **Genre Breakdown** - Discover your viewing preferences
- **Viewing Patterns** - Peak hours and favorite days of the week
- **Viewing Personality** - Fun personality type based on your habits
- **Binge Sessions** - See your longest viewing marathons
- **Monthly Journey** - Track your viewing across the year
- **Share Cards** - Download individual stat cards to share

## Requirements

### Emby Server Setup

1. **Emby Server** - Version 4.7+ recommended
2. **Playback Reporting Plugin** (Required)
   - Go to Emby Dashboard → Plugins → Catalog
   - Search for "Playback Reporting"
   - Install and restart Emby server
   - This plugin tracks detailed playback history needed for stats

3. **API Key**
   - Go to Emby Dashboard → API Keys
   - Create a new API key for "Emby Wrapped"
   - Copy the key for configuration

## Quick Start with Docker (Recommended)

### Option 1: Using Pre-built Image (Easiest)

1. Create a directory for your setup:
```bash
mkdir emby-wrapped && cd emby-wrapped
```

2. Create a `docker-compose.yml` file:
```yaml
version: '3.8'
services:
  emby-wrapped:
    image: ghcr.io/davidtorcivia/emby-wrapped-ftp:latest
    container_name: emby-wrapped
    ports:
      - "3000:3000"
    environment:
      - EMBY_SERVER_URL=http://your-emby-server:8096
      - EMBY_API_KEY=your-api-key-here
      - TMDB_API_KEY=  # Optional: for enhanced poster images
      - PUBLIC_URL=    # Optional: for share links
    volumes:
      - ./music:/app/static/music:ro  # Optional: custom background music
    restart: unless-stopped
```

3. Run:
```bash
docker-compose up -d
```

4. Access at `http://localhost:3000`

### Option 2: Build from Source

1. Clone the repository:
```bash
git clone https://github.com/davidtorcivia/emby-wrapped.git
cd emby-wrapped
```

2. Create your environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your Emby server details:
```env
EMBY_SERVER_URL=http://your-emby-server:8096
EMBY_API_KEY=your-api-key-here
# Optional
TMDB_API_KEY=
PUBLIC_URL=
```

4. Build and run:
```bash
docker-compose up -d --build
```

5. Access at `http://localhost:3000`

### Updating

**Pre-built image:**
```bash
docker-compose pull && docker-compose up -d
```

**From source:**
```bash
git pull && docker-compose up -d --build
```

## Local Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/davidtorcivia/emby-wrapped.git
cd emby-wrapped
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your Emby server details:
```env
EMBY_SERVER_URL=http://your-emby-server:8096
EMBY_API_KEY=your-api-key-here
```

5. Start development server:
```bash
npm run dev
```

6. Open `http://localhost:5173` in your browser

### Building for Production

```bash
npm run build
npm run preview
```

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `EMBY_SERVER_URL` | Full URL to your Emby server (e.g., `http://192.168.1.100:8096`) | Yes |
| `EMBY_API_KEY` | API key from Emby Dashboard | Yes |
| `TMDB_API_KEY` | TMDB API key for enhanced poster images (get one free at themoviedb.org) | No |
| `PUBLIC_URL` | Public URL for share links (defaults to request origin) | No |
| `ANALYTICS_SCRIPT` | Analytics script tag (e.g., Umami, Plausible) to inject into page head | No |

## Background Music

Emby Wrapped supports custom background music during the presentation. To add your own tracks:

1. Create a `static/music/` directory in the project
2. Add MP3 files to the directory
3. Music will automatically play during the wrapped experience

For Docker deployments, mount a volume to `/app/static/music/` (see docker-compose example).

## Usage

1. Navigate to the app in your browser
2. Select your user from the list
3. Enjoy your personalized Emby Wrapped experience!
4. Use the Share button on any card to download it as an image

## Tech Stack

- **Framework**: SvelteKit
- **Styling**: Tailwind CSS
- **Animations**: CSS animations + Svelte transitions
- **Image Capture**: html2canvas
- **Fonts**: Space Grotesk, JetBrains Mono

## Security Considerations

- API keys are stored server-side only and never exposed to the client
- All Emby API requests are proxied through the server
- No user data is stored - stats are fetched fresh each time
- CORS is handled server-side

## Troubleshooting

### "No users found"
- Verify your `EMBY_SERVER_URL` is correct and accessible
- Check that your `EMBY_API_KEY` has sufficient permissions

### Stats seem incomplete
- Make sure the **Playback Reporting** plugin is installed
- The plugin needs time to collect data - it only tracks plays after installation
- Check the date range - Emby Wrapped shows current year stats

### Images not loading
- Ensure your Emby server is accessible from the Emby Wrapped container/server
- Check for any firewall rules blocking the connection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Spotify Wrapped
- Built for the Emby community
- Uses the Emby API for data retrieval
