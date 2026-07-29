'use client';

import { useState } from 'react';
import { Download, Loader2, Music, Video } from 'lucide-react';

interface Format {
  format_id: string;
  ext: string;
  resolution: string;
  filesize?: number;
  format_note?: string;
  vcodec?: string;
  acodec?: string;
}

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration_string: string;
  formats: Format[];
  webpage_url: string;
}

interface VideoResultProps {
  videoInfo: VideoInfo;
}

export default function VideoResult({ videoInfo }: VideoResultProps) {
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);

  // Group and filter formats
  const processFormats = () => {
    const videoFormats: Format[] = [];
    let audioFormat: any = null;
    
    const sorted = [...(videoInfo?.formats || [])].reverse();
    
    sorted.forEach(f => {
      // Find best audio
      if (f.acodec !== 'none' && f.vcodec === 'none' && !audioFormat) {
        audioFormat = f;
      }
      
      // Find video formats
      if (f.vcodec !== 'none' && f.ext === 'mp4') {
        if (!videoFormats.find(vf => vf.resolution === f.resolution || vf.format_note === f.format_note)) {
           if (f.resolution !== 'audio only') {
               videoFormats.push(f);
           }
        }
      }
    });

    // Sort video by height (descending)
    videoFormats.sort((a, b) => {
      const resA = parseInt(a.resolution?.split('x')[1] || '0');
      const resB = parseInt(b.resolution?.split('x')[1] || '0');
      return resB - resA;
    });

    return { 
      videoFormats: videoFormats.slice(0, 5), 
      audioFormat: audioFormat as any 
    };
  };

  const { videoFormats, audioFormat } = processFormats();

  const handleDownload = async () => {
    if (!selectedFormat) return;
    
    setIsDownloading(true);
    setDownloadProgress('Starting download...');
    
    try {
      const isAudio = selectedFormat === (audioFormat as any)?.format_id;
      const downloadUrl = `/api/download?url=${encodeURIComponent(videoInfo.webpage_url)}&format_id=${selectedFormat}&type=${isAudio ? 'audio' : 'video'}`;
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.setAttribute('download', '');
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(null);
      }, 3000);
      
    } catch (err) {
      console.error('Download error', err);
      setIsDownloading(false);
      setDownloadProgress('Download failed.');
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown Size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="result-container">
      <div className="video-thumbnail">
        <img src={videoInfo.thumbnail} alt={videoInfo.title} />
      </div>
      
      <div className="video-info">
        <h3 className="video-title">{videoInfo.title}</h3>
        <div className="video-meta">
          <span>Duration: {videoInfo.duration_string || 'Unknown'}</span>
        </div>
        
        <h4>Select Format & Quality:</h4>
        <div className="format-selector">
          {videoFormats.map((f) => (
            <button
              key={f.format_id}
              className={`format-btn ${selectedFormat === f.format_id ? 'selected' : ''}`}
              onClick={() => setSelectedFormat(f.format_id)}
            >
              <Video size={20} />
              <span className="format-quality">{f.format_note || f.resolution}</span>
              <span className="format-type">MP4 • {formatSize(f.filesize)}</span>
            </button>
          ))}
          
          {audioFormat && (
            <button
              className={`format-btn ${selectedFormat === (audioFormat as any)?.format_id ? 'selected' : ''}`}
              onClick={() => setSelectedFormat((audioFormat as any)?.format_id)}
            >
              <Music size={20} />
              <span className="format-quality">Audio</span>
              <span className="format-type">MP3 Extract</span>
            </button>
          )}
        </div>
        
        <button 
          className="btn-primary" 
          onClick={handleDownload}
          disabled={!selectedFormat || isDownloading}
          style={{ width: '100%', marginTop: 'auto' }}
        >
          {isDownloading ? (
            <>
              <Loader2 className="loading" size={20} />
              {downloadProgress}
            </>
          ) : (
            <>
              <Download size={20} />
              Download {selectedFormat === (audioFormat as any)?.format_id ? 'Audio' : 'Video'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
