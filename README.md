# Portfolio Scraper API

A **Laravel + Next.js** project for scraping online portfolio websites (Canva, Behance, etc.). It extracts metadata, social links, videos, images, descriptions, and contact details into a structured database for viewing via a frontend UI.

---

## Table of Contents
- [Features](#features)
- [Universal Scraper Engine](#universal-scraper-engine)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Frontend (Next.js)](#frontend-nextjs)
- [Sample Data Output](#sample-data-output)
- [Setup Instructions](#setup-instructions)

---

## Features
- Scrapes portfolio sites (Canva, Behance, Dribbble, etc.)
- Extracts:
  - Title, descriptions, metadata
  - Images, videos
  - Social links, contact info
  - Content from JSON scripts and HTML
- Stores all data in a relational database
- RESTful API for scraping and retrieving data
- Next.js frontend for viewing and interacting with scraped data

---

## Universal Scraper Engine

The `UniversalScraper` class uses Laravel HTTP and Symfony DomCrawler to extract rich content from any URL:

- **Title, Descriptions, Metadata** from `<title>` and `<meta>` tags
- **Images** from `<img>` tags
- **Videos** from `<video>`, `<iframe>`, and raw links (YouTube, Vimeo)
- **Social Links**: from anchors, JSON blocks, and @username detection
- **Contact Info**: detects emails and social handles from text
- Supports embedded `<script type="application/json">`, fallback regex scraping, and absolute URL correction

---

## API Endpoints

### Scrape New URL
**POST** `/api/scrape`
```json
{
  "url": "https://example.my.canva.site/"
}
```

### Get All Scraped Data
**GET** `/api/scraped-data`

### Get Data by ID
**GET** `/api/scrape/{id}`

#### Example Usage
```bash
curl -s http://127.0.0.1:8000/api/scrape/2 | jq
```

---

## Database Schema

Below is the schema in table format, showing fields and relationships.

### ScrapedData
| Field        | Type      | Description                |
|--------------|-----------|----------------------------|
| id           | int       | Primary key                |
| url          | string    | URL scraped                |
| platform     | string    | Platform (canva, behance)  |
| status       | string    | Scrape status              |
| created_at   | datetime  | Created timestamp          |
| updated_at   | datetime  | Updated timestamp          |

### ContentDetail
| Field           | Type      | Description                |
|-----------------|-----------|----------------------------|
| id              | int       | Primary key                |
| scraped_data_id | int       | FK to ScrapedData          |
| title           | string    | Page title                 |
| description     | text      | Page description           |
| metadata        | json      | Meta tags                  |
| created_at      | datetime  | Created timestamp          |
| updated_at      | datetime  | Updated timestamp          |

### Video
| Field           | Type      | Description                |
|-----------------|-----------|----------------------------|
| id              | int       | Primary key                |
| scraped_data_id | int       | FK to ScrapedData          |
| type            | string    | Video type (iframe/url)    |
| src             | string    | Video source URL           |
| created_at      | datetime  | Created timestamp          |
| updated_at      | datetime  | Updated timestamp          |

### Image
| Field           | Type      | Description                |
|-----------------|-----------|----------------------------|
| id              | int       | Primary key                |
| scraped_data_id | int       | FK to ScrapedData          |
| url             | string    | Image URL                  |
| alt_text        | string    | Alt text                   |
| type            | string    | Image type                 |
| created_at      | datetime  | Created timestamp          |
| updated_at      | datetime  | Updated timestamp          |

### SocialLink
| Field           | Type      | Description                |
|-----------------|-----------|----------------------------|
| id              | int       | Primary key                |
| scraped_data_id | int       | FK to ScrapedData          |
| platform        | string    | Social platform            |
| username        | string    | Username/handle            |
| url             | string    | Profile URL                |
| type            | enum      | Type of social link        |
| created_at      | datetime  | Created timestamp          |
| updated_at      | datetime  | Updated timestamp          |

### ContactInfo
| Field           | Type      | Description                |
|-----------------|-----------|----------------------------|
| id              | int       | Primary key                |
| scraped_data_id | int       | FK to ScrapedData          |
| type            | string    | Contact type (email, etc.) |
| value           | string    | Contact value              |
| created_at      | datetime  | Created timestamp          |
| updated_at      | datetime  | Updated timestamp          |

#### **Relationships**
- **ScrapedData** has many **ContentDetail**, **Video**, **Image**, **SocialLink**, **ContactInfo**
- All related tables have a `scraped_data_id` foreign key to `ScrapedData`

---

## Frontend (Next.js)

- `/` — Home page with scrape form + all scraped cards
- `/scrape/[id]` — Show page with videos, social links, and metadata
- Fully dynamic UI using React state, styled inline (or with Tailwind/Chakra)

---

## Sample Data Output

```json
{
  "data": {
    "id": 2,
    "url": "https://sonuchoudhary.my.canva.site/portfolio",
    "platform": "canva",
    "content_detail": {
      "title": "SONU CHOUDHARY PORTFOLIO",
      "description": "i am professional video editor...",
      "metadata": {
        "description": "...",
        "og:title": "..."
      }
    },
    "videos": [
      { "src": "https://youtu.be/B6yRSDWiou4" }
    ],
    "images": [],
    "social_links": [
      { "platform": "instagram", "username": "theeditingentrepreneur" }
    ],
    "contact_infos": [
      { "type": "email", "value": "jabsvideo19@gmail.com" }
    ]
  }
}
```

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
```

### 2. Backend (Laravel API)
```bash
cd scraping-api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```
- Make sure your `.env` is set up for your DB. If you need a working `.env`, contact the author.
- The API will run at [http://127.0.0.1:8000](http://127.0.0.1:8000)

### 3. Frontend (Next.js)
```bash
cd ../scraping-frontend
npm install
npm run dev
```
- The frontend will run at [http://localhost:3000](http://localhost:3000)

---
