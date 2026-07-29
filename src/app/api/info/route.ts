import { NextRequest, NextResponse } from 'next/server';
import ytDlp from 'yt-dlp-exec';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL (basic)
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch video info using yt-dlp
    // We use dump-json to get the raw metadata
    const info = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
    });

    return NextResponse.json(info);
    
  } catch (error: any) {
    console.error('Error fetching video info:', error);
    
    // Check if it's a yt-dlp error (usually contains 'stderr')
    if (error.stderr) {
       // Return the specific error from yt-dlp to help diagnose
       const errorMessage = error.stderr.split('\n')[0] || 'Unknown yt-dlp error';
       return NextResponse.json({ error: `yt-dlp error: ${errorMessage}` }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'An unexpected error occurred while analyzing the URL.' }, { status: 500 });
  }
}
