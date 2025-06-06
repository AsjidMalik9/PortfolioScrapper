'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Correct import for accessing params in Next.js 13

function ScrapeShowPage() {
  const { id } = useParams();

  const [scrapeData, setScrapeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllImages, setShowAllImages] = useState(false);
  const IMAGES_TO_SHOW = 12;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/scrape/${id}`);
        if (!res.ok) throw new Error('Failed to fetch data');

        const result = await res.json();
        setScrapeData(result.data); // <-- updated to access nested data
        console.log('API response:', result.data);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!scrapeData) return <p>No data available.</p>;

  const { content_detail, videos, images, social_links, contact_infos } = scrapeData;
  const imagesToDisplay = images?.length && !showAllImages ? images.slice(0, IMAGES_TO_SHOW) : images;

  const socialIcons: Record<string, React.ReactNode> = {
    instagram: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>),
    facebook: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1877F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 8h-2a2 2 0 0 0-2 2v2h4l-.5 4h-3.5v6"/></svg>),
    linkedin: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A66C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><line x1="8" y1="11" x2="8" y2="16"/><line x1="8" y1="8" x2="8" y2="8"/><line x1="12" y1="16" x2="12" y2="11"/><path d="M16 16v-3a2 2 0 0 0-4 0"/></svg>),
    default: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>)
  };

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      if (!url) return '';
      if (url.includes('youtu.be/')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1].split(/[?&]/)[0]}`;
      if (url.includes('/embed/')) return url;
      if (url.includes('youtube.com/watch')) {
        const params = new URL(url).searchParams;
        const id = params.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes('youtube.com/shorts/')) return `https://www.youtube.com/embed/${url.split('youtube.com/shorts/')[1].split(/[?&]/)[0]}`;
      return url;
    } catch {
      return url;
    }
  };

  return (
    <main style={{ padding: '2rem', color: '#111', background: '#fff', minHeight: '100vh', maxWidth: 1100, margin: 'auto' }}>
      <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1976d2', marginBottom: 8 }}>Basic Info</h2>
      <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{content_detail?.title || 'No Title'}</div>
      <div style={{ fontSize: 17, color: '#444', marginBottom: 18 }}>{content_detail?.description || ''}</div>

      <div style={{ marginBottom: 24 }}>
        <span style={{ fontWeight: 600, fontSize: 18, marginRight: 8 }}>Links</span>
        <span style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap' }}>
          {social_links?.map((link, idx) => (
            <a
              key={idx}
              href={link.url ? link.url : `https://${link.platform}.com/${link.username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: '#1976d2', fontWeight: 500, fontSize: 16 }}
            >
              {socialIcons[link.platform] || socialIcons.default}
              <span>{link.platform}</span>
            </a>
          ))}
        </span>
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1976d2', margin: '24px 0 12px 0' }}>Employers / Clients</h2>
      {videos && videos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 24 }}>
          {videos.map((video: any, idx: number) => {
            let src = video.src;
            let isEmbeddable = false;
            if (src.includes('youtube.com') || src.includes('youtu.be')) {
              src = getYouTubeEmbedUrl(src);
              isEmbeddable = true;
            } else if (src.includes('vimeo.com')) {
              const match = src.match(/vimeo.com\/(\d+)/);
              if (match) {
                src = `https://player.vimeo.com/video/${match[1]}`;
                isEmbeddable = true;
              }
            }
            return (
              <div key={idx} style={{ width: '100%', maxWidth: 340, background: '#222', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
                {isEmbeddable ? (
                  <iframe
                    width="100%"
                    height="190"
                    src={src}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ display: 'block', width: '100%', border: 'none', borderRadius: 0 }}
                  />
                ) : (
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', color: '#fff', background: '#1976d2', padding: 18, textAlign: 'center', fontWeight: 500, textDecoration: 'none' }}
                  >
                    View Video
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: '#888', fontSize: 16, margin: '12px 0 24px 0' }}>No videos found.</div>
      )}

      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1976d2', margin: '24px 0 12px 0' }}>All Descriptions</h2>
      {content_detail?.metadata?.description ? (
        <div style={{ fontSize: 17, color: '#444', background: '#f7f7f7', borderRadius: 8, padding: 16 }}>
          {content_detail.metadata.description}
        </div>
      ) : (
        <p style={{ color: '#888' }}>No descriptions found.</p>
      )}
    </main>
  );
}

export default ScrapeShowPage;
