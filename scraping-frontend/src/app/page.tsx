'use client';

import React, { useState } from 'react';

// Social icon SVGs
const socialIcons: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>
  ),
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1877F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 8h-2a2 2 0 0 0-2 2v2h4l-.5 4h-3.5v6"/></svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A66C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><line x1="8" y1="11" x2="8" y2="16"/><line x1="8" y1="8" x2="8" y2="8"/><line x1="12" y1="16" x2="12" y2="11"/><path d="M16 16v-3a2 2 0 0 0-4 0"/></svg>
  ),
  default: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
  ),
};

function getSocialPlatform(url: string) {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'default';
}

function getYouTubeEmbedUrl(url: string) {
  url = url.replace(/^(https?:https?:)/, 'https:');
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes('youtube.com/shorts/')) {
    const id = url.split('youtube.com/shorts/')[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes('watch?v=')) {
    const id = url.split('watch?v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setScrapeResult(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setScrapeResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', color: '#111', background: '#fff', minHeight: '100vh', maxWidth: 900, margin: 'auto' }}>
      <h1 style={{ fontSize: 36, marginBottom: 16, color: '#1976d2' }}>URL Scraper</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          type="url"
          placeholder="Enter URL to scrape"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: 400,
            padding: '0.6rem 1rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: 16,
            outline: 'none',
            transition: 'border-color 0.3s',
          }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            marginLeft: 12,
            padding: '0.6rem 1.5rem',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#1976d2',
            color: '#fff',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#145a9d')}
          onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#1976d2')}
        >
          {loading ? 'Scraping...' : 'Scrape'}
        </button>
      </form>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      {scrapeResult && (
        <section
          style={{
            background: '#fefefe',
            borderRadius: 16,
            boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
            padding: 24,
            color: '#222',
          }}
        >
          {/* Description, Social Accounts, Metadata at top */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 28, marginBottom: 8, fontWeight: '700' }}>
              {scrapeResult.content?.title || 'No Title'}
            </h2>
            <p style={{ fontSize: 16, color: '#555', whiteSpace: 'pre-line', marginBottom: 16 }}>
              {scrapeResult.content?.description || scrapeResult.content?.metadata?.description || 'No description found.'}
            </p>

            {/* Social Links */}
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontWeight: '600', marginBottom: 8 }}>Social Accounts</h3>
              {scrapeResult.content?.social_links && Object.keys(scrapeResult.content.social_links).length > 0 ? (
                <ul style={{ display: 'flex', gap: 16, flexWrap: 'wrap', listStyle: 'none', paddingLeft: 0 }}>
                  {Object.entries(scrapeResult.content.social_links).map(([platform, links]) =>
                    (links as string[]).map((link, i) => (
                      <li key={platform + i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {socialIcons[platform] || socialIcons.default}
                        <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline', wordBreak: 'break-word' }}>
                          {link}
                        </a>
                      </li>
                    ))
                  )}
                </ul>
              ) : (
                <p style={{ color: '#999' }}>No social accounts found.</p>
              )}
            </div>

            {/* Metadata */}
            {scrapeResult.content?.metadata && Object.keys(scrapeResult.content.metadata).length > 0 && (
              <div style={{ marginTop: 24, background: '#f5f5f5', borderRadius: 12, padding: 16 }}>
                <h3 style={{ marginBottom: 12, fontWeight: '600' }}>Metadata</h3>
                <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 8, columnGap: 20, fontSize: 14, color: '#555' }}>
                  {Object.entries(scrapeResult.content.metadata).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <dt style={{ fontWeight: '600', textTransform: 'capitalize' }}>{key.replace(/[-_]/g, ' ')}</dt>
                      <dd>{String(value)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Videos Section */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 22, marginBottom: 16, fontWeight: '700', borderBottom: '2px solid #1976d2', paddingBottom: 6 }}>
              Videos
            </h3>
            {scrapeResult.content?.videos?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {scrapeResult.content.videos.map((video: any, idx: number) => {
                  const isYouTube = video.src.includes('youtube.com') || video.src.includes('youtu.be');
                  return (
                    <div
                      key={idx}
                      style={{
                        marginBottom: 10,
                        background: '#fafafa',
                        borderRadius: 12,
                        padding: 8,
                        boxShadow: '0 0 8px rgba(0,0,0,0.05)',
                        flex: '1 0 320px',
                      }}
                    >
                      {isYouTube ? (
                        <iframe
                          width="100%"
                          height="180"
                          src={getYouTubeEmbedUrl(video.src)}
                          title={`video-${idx}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ borderRadius: 12 }}
                        />
                      ) : (
                        <a href={video.src} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', wordBreak: 'break-word' }}>
                          {video.src}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#999' }}>No videos found.</p>
            )}
          </div>

          {/* Images Section */}
          <div>
            <h3 style={{ fontSize: 22, marginBottom: 16, fontWeight: '700', borderBottom: '2px solid #1976d2', paddingBottom: 6 }}>
              Images
            </h3>
            {scrapeResult.content?.images?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {scrapeResult.content.images.map((img: any, idx: number) => (
                  <img
                    key={idx}
                    src={typeof img === 'string' ? img : img.src}
                    alt={typeof img === 'string' ? `img-${idx}` : img.alt || `img-${idx}`}
                    style={{ width: 120, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', objectFit: 'cover' }}
                  />
                ))}
              </div>
            ) : (
              <p style={{ color: '#999' }}>No images found.</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
