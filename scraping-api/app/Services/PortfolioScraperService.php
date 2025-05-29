<?php

namespace App\Services;

use App\Models\ScrapedData;
use Illuminate\Support\Facades\Http;
use DOMDocument;
use DOMXPath;

class PortfolioScraperService
{
    protected $platforms = [
        'canva' => CanvaScraper::class,
        // Add more platforms here
    ];

    public function scrape(string $url)
    {
        $platform = $this->detectPlatform($url);
        $scraper = $this->getScraper($platform);

        return $scraper->scrape($url);
    }

    protected function detectPlatform(string $url): string
    {
        if (str_contains($url, 'canva.site')) {
            return 'canva';
        }
        // Add more platform detection logic here
        return 'unknown';
    }

    protected function getScraper(string $platform)
    {
        if (!isset($this->platforms[$platform])) {
            throw new \Exception("Unsupported platform: {$platform}");
        }

        $scraperClass = $this->platforms[$platform];
        return new $scraperClass();
    }
} 