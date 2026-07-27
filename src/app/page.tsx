'use client';

import { useState } from 'react';
import DownloaderForm from '@/components/DownloaderForm';
import VideoResult from '@/components/VideoResult';
import { Download, PlayCircle } from 'lucide-react';

export default function Home() {
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideoInfo = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setVideoInfo(null);
    
    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch video information');
      }
      
      const data = await res.json();
      setVideoInfo(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching video info.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <Download size={28} color="var(--primary)" />
          <span>Fluid</span>Downloader
        </div>
      </nav>

      <main>
        <div className="glass-panel">
          <h1>Download Videos instantly</h1>
          <p className="subtitle">
            Paste your link below to download high-quality MP4 videos or MP3 audio from YouTube, Instagram, TikTok, and more. Fast, free, and without limits.
          </p>

          <DownloaderForm onSubmit={fetchVideoInfo} isLoading={isLoading} />
          
          {error && (
            <div className="error-message">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {error}
            </div>
          )}

          {videoInfo && !isLoading && (
            <VideoResult videoInfo={videoInfo} />
          )}
        </div>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Fluid Downloader. Free and Fast Video Downloading.</p>
      </footer>
    </>
  );
}
