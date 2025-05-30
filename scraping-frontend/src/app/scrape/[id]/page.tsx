'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Correct import for accessing params in Next.js 13

function ScrapeShowPage() {
  const { id } = useParams(); // Access params from the URL

  const [scrapeData, setScrapeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllImages, setShowAllImages] = useState(false); // <-- moved up
  const IMAGES_TO_SHOW = 12;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/scrape/${id}`);
        if (!res.ok) throw new Error('Failed to fetch data');

        const data = await res.json();
        setScrapeData(data); // Set the entire response data
        console.log('API response:', data);
      } catch (err) {
        setError('Failed to load data'); // Set the error message
      } finally {
        setLoading(false); // Set loading to false after fetching is done
      }
    };

    if (id) {
      fetchData(); // Fetch data if id is available
    }
  }, [id]);

  // If loading, show loading message
  if (loading) return <p>Loading...</p>;

  // If error occurs, show error message
  if (error) return <p>{error}</p>;

  // If no scrape data or content is available, show fallback message
  if (!scrapeData || !scrapeData.content) {
    return <p>No data available.</p>;
  }

  const { content } = scrapeData || {};
  const { images, videos, title, description, descriptions, social_links } = content || {};
  const imagesToDisplay = images?.length && !showAllImages ? images.slice(0, IMAGES_TO_SHOW) : images;

  return (
    <main style={{ padding: '2rem', color: '#111', background: '#fff', minHeight: '100vh', maxWidth: 900, margin: 'auto' }}>
      <h1 style={{ fontSize: 36, marginBottom: 16, color: '#1976d2' }}>
        {title || 'No Title'}
      </h1>

      {/* Main Description */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, color: '#333', marginBottom: 8 }}>Main Description</h2>
        <p style={{ fontSize: 16, color: '#555', whiteSpace: 'pre-line', marginBottom: 0 }}>
          {description || 'No description available.'}
        </p>
      </section>

      {/* Videos Section */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, color: '#333', marginBottom: 8 }}>Videos</h2>
        {videos?.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {videos.map((video: any, idx: number) => {
              let embedUrl = '';
              let canEmbed = true;
              // YouTube watch
              if (/youtube\.com\/watch\?v=([\w-]+)/.test(video.src)) {
                const match = video.src.match(/v=([\w-]+)/);
                if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
                else canEmbed = false;
              }
              // YouTube Shorts
              else if (/youtube\.com\/shorts\/([\w-]+)/.test(video.src)) {
                const match = video.src.match(/shorts\/([\w-]+)/);
                if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
                else canEmbed = false;
              }
              // youtu.be short link
              else if (/youtu\.be\/([\w-]+)/.test(video.src)) {
                const match = video.src.match(/youtu\.be\/([\w-]+)/);
                if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
                else canEmbed = false;
              }
              // Vimeo
              else if (/vimeo\.com\/([\d]+)/.test(video.src)) {
                const match = video.src.match(/vimeo\.com\/([\d]+)/);
                if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
                else canEmbed = false;
              }
              // Unknown type: fallback to link
              else {
                canEmbed = false;
              }
              return (
                <div key={idx} style={{ marginBottom: 12 }}>
                  {canEmbed ? (
                    <iframe
                      width="300"
                      height="170"
                      src={embedUrl}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <a href={video.src} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                      View Video
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p>No videos found.</p>
        )}
      </section>

      {/* Images Section */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, color: '#333', marginBottom: 8 }}>Images</h2>
        {images?.length ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '16px',
                marginBottom: 12,
              }}
            >
              {imagesToDisplay.map((img: any, idx: number) => (
                <img
                  key={idx}
                  src={img.src}
                  alt={img.alt || 'Image'}
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    objectFit: 'cover',
                    borderRadius: 10,
                    boxShadow: '0 1px 5px rgba(0,0,0,0.08)',
                    border: '1px solid #eee',
                    background: '#fafafa',
                    transition: 'box-shadow 0.2s, border 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.15)')}
                  onMouseOut={e => (e.currentTarget.style.boxShadow = '0 1px 5px rgba(0,0,0,0.08)')}
                />
              ))}
            </div>
            {images.length > IMAGES_TO_SHOW && (
              <button
                onClick={() => setShowAllImages(v => !v)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#1976d2',
                  color: '#fff',
                  fontWeight: 500,
                  cursor: 'pointer',
                  margin: '0 auto',
                  display: 'block',
                }}
              >
                {showAllImages ? 'Show Less' : `Show More (${images.length - IMAGES_TO_SHOW})`}
              </button>
            )}
          </>
        ) : (
          <p>No images found.</p>
        )}
      </section>

      {/* Social Links Section */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, color: '#333', marginBottom: 8 }}>Social Links</h2>
        {social_links && Object.keys(social_links).length > 0 ? (
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {Object.entries(social_links).map(([platform, links]) =>
              Array.isArray(links)
                ? links.map((link, idx) => (
                    <li key={platform + idx} style={{ marginBottom: 4 }}>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <strong style={{ textTransform: 'capitalize' }}>{platform}</strong>: {link}
                      </a>
                    </li>
                  ))
                : null
            )}
          </ul>
        ) : (
          <p>No social links available.</p>
        )}
      </section>

      {/* All Descriptions Section */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, color: '#333', marginBottom: 8 }}>All Descriptions</h2>
        {descriptions && descriptions.length > 0 ? (
          <div style={{ background: '#f7f7f7', borderRadius: 8, padding: 16 }}>
            {descriptions.map((desc: string, idx: number) => (
              <div key={idx} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                {desc}
              </div>
            ))}
          </div>
        ) : (
          <p>No descriptions found.</p>
        )}
      </section>
    </main>
  );
}

export default ScrapeShowPage;
