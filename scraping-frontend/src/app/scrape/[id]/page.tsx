'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Correct import for accessing params in Next.js 13

function ScrapeShowPage() {
  const { id } = useParams(); // Access params from the URL

  const [scrapeData, setScrapeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/scrape/${id}`);
        if (!res.ok) throw new Error('Failed to fetch data');

        const data = await res.json();
        setScrapeData(data); // Set the entire response data
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

  const { content, images, videos, social_links } = scrapeData.content || {};

  return (
    <main style={{ padding: '2rem', color: '#111', background: '#fff', minHeight: '100vh', maxWidth: 900, margin: 'auto' }}>
      <h1 style={{ fontSize: 36, marginBottom: 16, color: '#1976d2' }}>
        {content?.title || 'No Title'}
      </h1>
      <p style={{ fontSize: 16, color: '#555', whiteSpace: 'pre-line', marginBottom: 16 }}>
        {content?.description || 'No description available.'}
      </p>

      {/* Render sections from scrapeData */}
      <div>
        <h3>Content Sections</h3>
        {content?.content?.map((item: any, idx: number) => (
          <div key={idx}>
            <strong>{item.type}</strong>: {item.text}
          </div>
        ))}
      </div>

      {/* Render social links */}
      <div>
        <h3>Social Links</h3>
        {social_links && social_links.length > 0 ? (
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {social_links.map((link: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, i: React.Key | null | undefined) => (
              <li key={i}>
                <a href={link as string} target="_blank" rel="noopener noreferrer">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No social links available.</p>
        )}
      </div>

      {/* Render videos if available */}
      <div>
        <h3>Videos</h3>
        {videos?.length ? (
          <div>
            {videos.map((video: any, idx: number) => (
              <div key={idx}>
                <iframe
                  width="300"
                  height="170"
                  src={`https://www.youtube.com/embed/${video.src.split('watch?v=')[1]}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        ) : (
          <p>No videos found.</p>
        )}
      </div>

      {/* Render images if available */}
      <div>
        <h3>Images</h3>
        {images?.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {images.map((img: any, idx: number) => (
              <img
                key={idx}
                src={img.src}
                alt={img.alt || 'Image'}
                style={{ width: 120, borderRadius: 8, boxShadow: '0 1px 5px rgba(0, 0, 0, 0.2)' }}
              />
            ))}
          </div>
        ) : (
          <p>No images found.</p>
        )}
      </div>
    </main>
  );
}

export default ScrapeShowPage;
