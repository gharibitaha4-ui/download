import { NextResponse } from 'next/server';
import ytDlp from 'yt-dlp-exec';
import fs from 'fs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const secretCookiesPath = '/etc/secrets/cookies.txt';

    // Base options safe for TypeScript YtFlags
    const options: Record<string, any> = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
    };

    // Zid cookies file ila kan kayn f Render
    if (fs.existsSync(secretCookiesPath)) {
      options.cookiefile = secretCookiesPath;
    }

    // 1. Fetch JSON info from yt-dlp
    const output: any = await ytDlp(videoUrl, options);

    // 2. Extract Direct MP4 Video URL (TikTok, Insta, YouTube)
    let downloadUrl = output.url;

    if (!downloadUrl && output.formats && Array.isArray(output.formats)) {
      // N-qllbo 3la video/audio format
      const bestFormat = output.formats
        .reverse()
        .find((f: any) => f.url && f.ext === 'mp4' && f.vcodec !== 'none');

      downloadUrl = bestFormat?.url || output.formats[output.formats.length - 1]?.url;
    }

    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'Could not extract direct video URL' },
        { status: 400 }
      );
    }

    // 3. Return JSON with the MP4 link to Front-end (Machi Raw File)
    return NextResponse.json({
      title: output.title || 'Video',
      thumbnail: output.thumbnail || output.thumbnails?.[0]?.url || '',
      duration: output.duration || 0,
      downloadUrl: downloadUrl, // 👈 Direct MP4 Link
    });

  } catch (error: any) {
    console.error('yt-dlp error:', error);
    return NextResponse.json(
      { error: error?.stderr || error?.message || 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
