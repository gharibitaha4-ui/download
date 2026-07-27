import { useState, FormEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface DownloaderFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function DownloaderForm({ onSubmit, isLoading }: DownloaderFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="input-group">
      <input
        type="url"
        className="input-field"
        placeholder="Paste video URL here (e.g., https://youtube.com/...)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        disabled={isLoading}
      />
      <button 
        type="submit" 
        className="btn-primary" 
        disabled={isLoading || !url.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="loading" size={20} />
            Analyzing...
          </>
        ) : (
          <>
            <Search size={20} />
            Start
          </>
        )}
      </button>
    </form>
  );
}
