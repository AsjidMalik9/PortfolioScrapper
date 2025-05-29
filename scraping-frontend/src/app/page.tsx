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

// Helper to get YouTube embed URL
function getYouTubeEmbedUrl(url: string) {
  // Remove any leading protocol duplication
  url = url.replace(/^(https?:https?:)/, 'https:');
  // Handle youtu.be short links
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  // Handle shorts
  if (url.includes('youtube.com/shorts/')) {
    const id = url.split('youtube.com/shorts/')[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  // Handle normal watch?v=
  if (url.includes('watch?v=')) {
    const id = url.split('watch?v=')[1].split('&')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  // Otherwise, return as is
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
    <main style={{ padding: '2rem', color: '#111', background: '#fff', minHeight: '100vh' }}>
      <h1>URL Scraper</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Enter URL to scrape"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: 300, padding: '0.5rem' }}
          required
        />
        <button type="submit" disabled={loading} style={{ marginLeft: 10, padding: '0.5rem 1rem' }}>
          {loading ? 'Scraping...' : 'Scrape'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {scrapeResult && (
        <section style={{ marginTop: 30, maxWidth: 700, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 24, color: '#111' }}>
          <h2 style={{ fontSize: 28, marginBottom: 8, color: '#111' }}>{scrapeResult.content?.title || 'No Title'}</h2>
          <p style={{ color: '#444', fontSize: 18, marginBottom: 18 }}>
            {scrapeResult.content?.description || scrapeResult.content?.metadata?.description || ''}
          </p>

          {/* Images */}
          {scrapeResult.content?.images?.length ? (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#111' }}>Images:</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {scrapeResult.content.images.map((img: any, idx: number) => (
                  <img
                    key={idx}
                    src={typeof img === 'string' ? img : img.src}
                    alt={typeof img === 'string' ? `img-${idx}` : img.alt || `img-${idx}`}
                    style={{ width: 120, borderRadius: 8, boxShadow: '0 1px 4px #0002' }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Videos */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#111' }}>Videos:</h3>
            {scrapeResult.content?.videos?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {scrapeResult.content.videos.map((video: any, idx: number) => {
                  const isYouTube = video.src.includes('youtube.com') || video.src.includes('youtu.be');
                  return (
                    <div key={idx} style={{ marginBottom: 10, background: '#f9f9f9', borderRadius: 8, padding: 8 }}>
                      {isYouTube ? (
                        <iframe
                          width="300"
                          height="170"
                          src={getYouTubeEmbedUrl(video.src)}
                          title={`video-${idx}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ borderRadius: 8 }}
                        />
                      ) : (
                        <a href={video.src} target="_blank" rel="noopener noreferrer">
                          {video.src}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No videos found.</p>
            )}
          </div>

          {/* Social Links */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#111' }}>Social Links:</h3>
            {/* Check for links in content.social_links (object) and content.links.social (array) */}
            {(
              (scrapeResult.content?.social_links && Object.values(scrapeResult.content.social_links).some((arr: any) => Array.isArray(arr) && arr.length > 0)) ||
              (scrapeResult.content?.links?.social?.length)
            ) ? (
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 16, listStyle: 'none', padding: 0 }}>
                {/* Render from content.social_links if present */}
                {scrapeResult.content?.social_links &&
                  Object.entries(scrapeResult.content.social_links).map(([platform, links]) =>
                    (links as string[]).map((link, i) => (
                      <li key={platform + i} style={{ display: 'flex', alignItems: 'center' }}>
                        <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {socialIcons[platform] || socialIcons.default}
                          {link}
                        </a>
                      </li>
                    ))
                  )
                }
                {/* Render from content.links.social if present */}
                {scrapeResult.content?.links?.social?.map((link: string, i: number) => {
                  const platform = getSocialPlatform(link);
                  return (
                    <li key={link + i} style={{ display: 'flex', alignItems: 'center' }}>
                      <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {socialIcons[platform] || socialIcons.default}
                        {link}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No social links found.</p>
            )}
          </div>

          {/* Contact Info */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#111' }}>Contact Info:</h3>
            {/* Emails */}
            {scrapeResult.content?.contact_info?.email?.length ? (
              <div style={{ marginBottom: 8 }}>
                <strong>Emails:</strong>
                <ul>
                  {scrapeResult.content.contact_info.email.map((email: string, i: number) => (
                    <li key={i}>{email}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No emails found.</p>
            )}
            {/* Social Handles */}
            {scrapeResult.content?.contact_info?.social?.length ? (
              <div style={{ marginBottom: 8 }}>
                <strong>Social Handles:</strong>
                <ul>
                  {scrapeResult.content.contact_info.social.map((handle: string, i: number) => (
                    <li key={i}>{handle}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Other Links */}
          {scrapeResult.content?.links?.other?.length ? (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#111' }}>Other Links:</h3>
              <ul>
                {scrapeResult.content.links.other.map((link: string, i: number) => (
                  <li key={i}>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Metadata */}
          {scrapeResult.content?.metadata && (
            <div style={{ marginTop: 24, background: '#f5f5f5', borderRadius: 8, padding: 12 }}>
              <h4 style={{ marginBottom: 8, color: '#111' }}>Metadata:</h4>
              <ul style={{ fontSize: 14, color: '#666' }}>
                {Object.entries(scrapeResult.content.metadata).map(([key, value]) => (
                  <li key={key}><strong>{key}:</strong> {value as string}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
