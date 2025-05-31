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
    // youtu.be short links
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    // youtube.com/embed/ links
    if (url.includes('/embed/')) {
      return url;
    }
    // youtube.com/watch?v= links
    if (url.includes('youtube.com/watch')) {
      const params = new URL(url).searchParams;
      const id = params.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    // youtube.com/shorts/ links
    if (url.includes('youtube.com/shorts/')) {
      const id = url.split('youtube.com/shorts/')[1].split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    // fallback
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

  // Scrape URL submit handler (existing)
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
      setScrapeResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoadingScrape(false);
    }
  };

  // Fetch all stored scraped records from API
  const fetchStoredScrapes = async () => {
    setLoadingStored(true);
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/scraped-data');
      if (!res.ok) throw new Error(`Failed to fetch stored data: ${res.status}`);
      const responseData = await res.json();
      const dataArray = responseData.data;  // <-- This is your array

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

  // Navigate to show page on card click
  const handleCardClick = (id: number) => {
    router.push(`/scrape/${id}`);
  };

  return (
    <main style={{ padding: '2rem', color: '#111', background: '#fff', minHeight: '100vh', maxWidth: 900, margin: 'auto' }}>
      <h1 style={{ fontSize: 36, marginBottom: 16, color: '#1976d2' }}>URL Scraper</h1>

      {/* Show All Scraped Data Button and Section at the top */}
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
                  {item.content?.title || 'No Title'}
                </h3>
                <p style={{ fontSize: 14, color: '#666', height: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.content?.description || item.content?.metadata?.description || 'No description'}
                </p>
                {/* Social Links (summary) */}
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

      {/* Form to submit URL to scrape */}
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

      {/* Display scraped result from form */}
      {scrapeResult && (
        <section
          style={{
            background: '#fefefe',
            borderRadius: 16,
            boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
            padding: 24,
            color: '#222',
            marginBottom: 32,
          }}
        >
          {/* BASIC INFO SECTION */}
          <h2 style={{ fontSize: 24, marginBottom: 12, fontWeight: '700', color: '#1976d2' }}>Basic Info</h2>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 20 }}>
            {/* Main Image */}
            {scrapeResult.content?.main_image && (
              <img
                src={scrapeResult.content.main_image}
                alt="Main"
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.12)' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 22, margin: 0 }}>{scrapeResult.content?.title || 'No Name'}</h3>
              <p style={{ fontSize: 16, color: '#555', margin: '8px 0 12px 0', whiteSpace: 'pre-line' }}>
                {scrapeResult.content?.headline || scrapeResult.content?.description || scrapeResult.content?.metadata?.description || 'No headline/description found.'}
              </p>
            </div>
          </div>

          {/* LINKS SECTION (Social, Contact, Other) */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Links</h4>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Social Links */}
              {scrapeResult.content?.social_links && Object.keys(scrapeResult.content.social_links).length > 0 &&
                Object.entries(scrapeResult.content.social_links).map(([platform, links]) =>
                  (Array.isArray(links) ? links : []).map((link, idx) => (
                    <a
                      key={platform + idx}
                      href={link.startsWith('http') ? link : `https://www.${platform}.com/${link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}
                    >
                      {socialIcons[platform] || socialIcons.default}
                      <span style={{ fontSize: 14 }}>{platform}</span>
                    </a>
                  ))
                )}
              {/* Contact Links */}
              {scrapeResult.content?.links?.contact && scrapeResult.content.links.contact.length > 0 &&
                scrapeResult.content.links.contact.map((link: string, idx: number) => (
                  <a key={"contact" + idx} href={link} style={{ color: '#1976d2', textDecoration: 'underline', fontSize: 14 }} target="_blank" rel="noopener noreferrer">Contact</a>
                ))}
              {/* Other Links */}
              {scrapeResult.content?.links?.other && scrapeResult.content.links.other.length > 0 &&
                scrapeResult.content.links.other.map((link: string, idx: number) => (
                  <a key={"other" + idx} href={link} style={{ color: '#1976d2', textDecoration: 'underline', fontSize: 14 }} target="_blank" rel="noopener noreferrer">Other</a>
                ))}
            </div>
          </div>

          {/* VIDEOS SECTION (all videos, regardless of employer/client) */}
          <h2 style={{ fontSize: 22, marginBottom: 10, fontWeight: '700', color: '#1976d2' }}>Employers / Clients</h2>
          {scrapeResult.content?.videos && scrapeResult.content.videos.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              {scrapeResult.content.videos.map((video: any, vIdx: number) => {
                let src = '';
                let isEmbeddable = false;
                if (video.src) {
                  if (video.src.includes('youtube.com') || video.src.includes('youtu.be')) {
                    src = getYouTubeEmbedUrl(video.src);
                    isEmbeddable = true;
                  } else if (video.src.includes('vimeo.com')) {
                    // Vimeo embed
                    const match = video.src.match(/vimeo.com\/(\d+)/);
                    if (match) {
                      src = `https://player.vimeo.com/video/${match[1]}`;
                      isEmbeddable = true;
                    }
                  } else {
                    src = video.src;
                  }
                }
                if (!src) return null;
                return (
                  <div key={vIdx} style={{ width: 220, minHeight: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {isEmbeddable ? (
                      <iframe
                        width="200"
                        height="120"
                        src={src}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ borderRadius: 8 }}
                      />
                    ) : (
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '10px 18px',
                          background: '#1976d2',
                          color: '#fff',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontWeight: 500,
                          marginTop: 20,
                        }}
                      >
                        View Video
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#888', fontSize: 15, margin: '8px 0 18px 0' }}>No videos found.</div>
          )}

          {/* ALL DESCRIPTIONS SECTION */}
          <h2 style={{ fontSize: 22, marginBottom: 10, fontWeight: '700', color: '#1976d2' }}>All Descriptions</h2>
          {scrapeResult.content?.descriptions && scrapeResult.content.descriptions.length > 0 ? (
            <ul style={{ paddingLeft: 18 }}>
              {scrapeResult.content.descriptions.map((desc: string, idx: number) => (
                <li key={idx} style={{ marginBottom: 6, color: '#444', fontSize: 15 }}>{desc}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#888' }}>No descriptions found.</p>
          )}
        </section>
      )}
    </main>
  );
}
