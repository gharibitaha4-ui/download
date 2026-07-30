import { NextResponse } from 'next/server';
import ytDlp from 'yt-dlp-exec';
import { promises as fs } from 'fs';

// Configuration constants
const SECRET_COOKIES_PATH = '/etc/secrets/cookies.txt';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Check cookies availability asynchronously
    const hasCookies = await fs.access(SECRET_COOKIES_PATH).then(() => true).catch(() => false);

    const baseOptions: Record<string, any> = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      // Format preference: Progressive mp4 (video+audio combined) with best resolution
      format: 'best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
    };

    let output: any;

    try {
      // Attempt 1: Spoof Android Client (Fast & circumvents many age/bot blocks)
      output = await ytDlp(videoUrl, {
        ...baseOptions,
        extractorArgs: 'youtube:player_client=android',
      });
    } catch (firstError: any) {
      const errorMsg = String(firstError?.stderr || firstError?.message || '');
      const isBotBlock = errorMsg.includes('Sign in to confirm') || errorMsg.includes('Bot Detection');

      if (isBotBlock && hasCookies) {
        // Attempt 2: Fallback with cookies file
        output = await ytDlp(videoUrl, {
          ...baseOptions,
          cookies: SECRET_COOKIES_PATH,
        });
      } else {
        throw firstError;
      }
    }

    // Extract best muxed download URL
    const downloadUrl = extractDirectUrl(output);

    if (!downloadUrl) {
      return NextResponse.json({ error: 'Could not extract direct stream URL' }, { status: 422 });
    }

    return NextResponse.json({
      title: output.title ?? 'Untitled Video',
      thumbnail: output.thumbnail ?? output.thumbnails?.[0]?.url ?? null,
      duration: output.duration ?? 0,
      downloadUrl,
    });
  } catch (error: any) {
    console.error('yt-dlp execution error:', error);
    
    const errorMessage = typeof error?.stderr === 'string' 
      ? error.stderr 
      : error?.message || 'Failed to process YouTube video';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Helper to determine the best single direct URL from yt-dlp metadata
 */
function extractDirectUrl(output: any): string | null {
  if (output?.url) return output.url;

  if (Array.isArray(output?.formats)) {
    // 1. Prioritize pre-merged video+audio (vcodec & acodec present)
    const muxedFormats = output.formats.filter(
      (f: any) => f.vcodec !== 'none' && f.acodec !== 'none' && f.url
    );

    if (muxedFormats.length > 0) {
      // Return the highest height/bitrate muxed format
      const bestMuxed = muxedFormats.reduce((prev: any, current: any) => {
        return (current.height || 0) > (prev.height || 0) ? current : prev;
      });
      return bestMuxed.url;
    }

    // 2. Fallback to last available format with a valid URL
    const validFormats = output.formats.filter((f: any) => f.url);
    if (validFormats.length > 0) {
      return validFormats[validFormats.length - 1].url;
    }
  }

  return null;
}
