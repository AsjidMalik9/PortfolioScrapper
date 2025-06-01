# Portfolio Scraper – Documentation

## Database Design (ER Diagram)

```
+-------------------+
|   scraped_data    |
+-------------------+
| id (PK)           |
| url (unique)      |  <-- Every scraped URL is stored here. If the same URL is scraped again, it is updated.
| content (JSON)    |  <-- All scraped data (see below for structure)
| metadata (JSON)   |
| platform (string) |
| status (string)   |
| created_at        |
| updated_at        |
+-------------------+
```

- **url**: Unique, ensures no duplicate scrapes for the same URL.
- **content**: JSON, holds all structured scraped data.

### Example `content` JSON

```
{
  "title": "SONU CHOUDHARY PORTFOLIO",
  "description": "i am professional video editor, i providing video editing service. this is my portfolio website.",
  "content": [],
  "images": [],
  "videos": [
    { "type": "url", "src": "https://youtube.com/shorts/8AGB1xLj-Vc" },
    ...
  ],
  "links": {
    "social": [],
    "contact": [],
    "other": []
  },
  "metadata": { ... },
  "contact_info": {
    "email": ["jabsvideo19@gmail.com"],
    "social": ["@gmail.com", "@theeditingentrepreneur"]
  },
  "social_links": {
    "instagram": ["theeditingentrepreneur"],
    "facebook": ["profile.php?id=123"],
    "linkedin": ["sonuchoudharyprofile"]
  },
  "descriptions": [
    "i am professional video editor, i providing video editing service. this is my portfolio website."
  ]
}
```

---

## How Scraping Works

The core logic is in `UniversalScraper.php` (Laravel backend):

- **crawlUrl($url)**: Main method. Fetches the HTML, parses it, and fills the `content` JSON.
- **Description Extraction**: Uses Symfony DomCrawler and (optionally) voku/simple_html_dom to extract meta descriptions, heading/paragraph blocks, and large text blocks. Deduplicates and prioritizes the most relevant description.
- **Platform Detection**: Checks the URL for known platforms (Canva, Behance, Dribbble, etc.) to set the `platform` field.
- **Content & Images**: Extracts all headings, paragraphs, articles, sections, and images with their attributes.
- **Videos**: Finds <video> and <iframe> tags, and also uses regex to find YouTube/Vimeo links in the raw HTML.
- **Links**: Extracts all <a> tags, then intelligently filters out fake, irrelevant, or duplicate links. Social/contact/other links are separated and deduplicated.
- **Contact Info**: Extracts emails and social handles from the page text.
- **Social Links**: Merges links found in HTML, JSON scripts, and text, then deduplicates.

---

## Frontend (Next.js)

- Located in `scraping-frontend/`
- Main page allows submitting a portfolio URL, which is sent to the backend for scraping.
- Also displays all previously scraped records as cards.
- Each record can be viewed in detail, showing all structured data (basic info, links, videos, descriptions, etc).

---

## Setup Instructions

### 1. Clone the repository

```
git clone <your-repo-url>
```

### 2. Backend (Laravel API)

```
cd scraping-api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

- Make sure your `.env` is set up for your DB. If you need a working `.env`, contact the author.
- The API will run at http://127.0.0.1:8000

### 3. Frontend (Next.js)

```
cd ../scraping-frontend
npm install
npm run dev
```

- The frontend will run at http://localhost:3000

---

## API Endpoints

### 1. Scrape a Portfolio URL

- **POST** `/api/scrape`
- **Body:** `{ "url": "https://example.com" }`
- **Response:**
  - `data`: The full scraped content JSON (see above)

**Example cURL:**
```
curl -X POST http://127.0.0.1:8000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://sonuchoudharyportfolio.com"}'
```

### 2. Get All Scraped Records

- **GET** `/api/scraped-data`
- **Response:**
  - `data`: Array of all scraped records (with all fields)

**Example cURL:**
```
curl http://127.0.0.1:8000/api/scraped-data
```

### 3. Get a Single Scraped Record by ID

- **GET** `/api/scraped-data/{id}`
- **Response:**
  - `data`: The scraped record for that ID

**Example cURL:**
```
curl http://127.0.0.1:8000/api/scraped-data/1
```

---

## API Summary

- `POST /api/scrape` – Scrape a new portfolio URL (or update if already exists)
- `GET /api/scraped-data` – List all scraped records
- `GET /api/scraped-data/{id}` – Get a single scraped record by ID

---

## Contact

For questions, setup help, or a working `.env` file, contact the author.
