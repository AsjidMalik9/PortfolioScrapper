'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Social icon SVGs (same as before)
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
  try {
    if (!url) return '';
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('/embed/')) return url;
    if (url.includes('youtube.com/watch')) {
      const params = new URL(url).searchParams;
      const id = params.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtube.com/shorts/')) {
      const id = url.split('youtube.com/shorts/')[1].split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [storedScrapes, setStoredScrapes] = useState<any[]>([]);
  const [loadingScrape, setLoadingScrape] = useState(false);
  const [loadingStored, setLoadingStored] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingScrape(true);
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
      const normalized = data.data;
      setScrapeResult({
        content: {
          title: normalized.content_detail?.title,
          description: normalized.content_detail?.description,
          metadata: normalized.content_detail?.metadata,
        },
        videos: normalized.videos || [],
        images: normalized.images || [],
        social_links: normalized.social_links || [],
        contact_infos: normalized.contact_infos || [],
        created_at: normalized.created_at,
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoadingScrape(false);
    }
  };

  const fetchStoredScrapes = async () => {
    setLoadingStored(true);
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/scraped-data');
      if (!res.ok) throw new Error(`Failed to fetch stored data: ${res.status}`);
      const responseData = await res.json();
      const dataArray = responseData.data;
      const sorted = dataArray.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setStoredScrapes(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stored data');
    } finally {
      setLoadingStored(false);
    }
  };

  const handleCardClick = (id: number) => {
    router.push(`/scrape/${id}`);
  };

  return (
    <main style={{ padding: '2rem', color: '#111', background: '#fff', minHeight: '100vh', maxWidth: 900, margin: 'auto' }}>
      <h1 style={{ fontSize: 36, marginBottom: 16, color: '#1976d2' }}>Portfolio Scraper</h1>

      <button
        onClick={fetchStoredScrapes}
        disabled={loadingStored}
        style={{
          marginBottom: 24,
          padding: '0.6rem 1.5rem',
          borderRadius: 8,
          border: 'none',
          backgroundColor: '#1976d2',
          color: '#fff',
          fontWeight: 'bold',
          cursor: loadingStored ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s',
          fontSize: 18,
        }}
        onMouseEnter={e => !loadingStored && (e.currentTarget.style.backgroundColor = '#145a9d')}
        onMouseLeave={e => !loadingStored && (e.currentTarget.style.backgroundColor = '#1976d2')}
      >
        {loadingStored ? 'Loading All Scraped Data...' : 'Show All Scraped Data'}
      </button>

      {storedScrapes.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, marginBottom: 16, color: '#1976d2' }}>All Scraped Records</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {storedScrapes.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item.id)}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #ddd',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'box-shadow 0.3s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
              >
                <h3 style={{ marginBottom: 8, fontWeight: '700', fontSize: 20 }}>
                  {item.content_detail?.title || 'No Title'}
                </h3>
                <p style={{ fontSize: 14, color: '#666', height: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.content_detail?.description || item.content_detail?.metadata?.description || 'No description'}
                </p>
                {item.content?.social_links && Object.keys(item.content.social_links).length > 0 && (
                  <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
                    {Object.entries(item.content.social_links).map(([platform, links]) =>
                      (Array.isArray(links) ? links : []).map((link, idx) => (
                        <a
                          key={platform + idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', color: '#1976d2' }}
                          onClick={e => e.stopPropagation()}
                        >
                          {socialIcons[platform] || socialIcons.default}
                        </a>
                      ))
                    )}
                  </div>
                )}
                <p style={{ fontSize: 12, color: '#999' }}>
                  Created: {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

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
          disabled={loadingScrape}
          style={{
            marginLeft: 12,
            padding: '0.6rem 1.5rem',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#1976d2',
            color: '#fff',
            fontWeight: 'bold',
            cursor: loadingScrape ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={e => !loadingScrape && (e.currentTarget.style.backgroundColor = '#145a9d')}
          onMouseLeave={e => !loadingScrape && (e.currentTarget.style.backgroundColor = '#1976d2')}
        >
          {loadingScrape ? 'Scraping...' : 'Scrape'}
        </button>
      </form>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
    </main>
  );
}
