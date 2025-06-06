<?php

namespace App\Services;

use App\Models\ScrapedData;
use Illuminate\Support\Facades\Http;
use DOMDocument;
use DOMXPath;

class CanvaScraper
{
    public function scrape(string $url)
    {
        $scrapedData = ScrapedData::where('url', $url)->first();
        if ($scrapedData) {
            $scrapedData->videos()->delete();
            $scrapedData->images()->delete();
            $scrapedData->socialLinks()->delete();
            $scrapedData->contactInfos()->delete();
            $scrapedData->contentDetail()?->delete();
            $scrapedData->update([
                'platform' => 'canva',
                'status' => 'pending',
            ]);
        } else {
            $scrapedData = ScrapedData::create([
                'url' => $url,
                'platform' => 'canva',
                'status' => 'pending',
            ]);
        }

        try {
            $response = Http::get($url);
            $html = $response->body();
            $dom = new DOMDocument();
            @$dom->loadHTML($html);
            $xpath = new DOMXPath($dom);

            // Extract data
            $data = [
                'title' => $this->extractTitle($xpath),
                'sections' => $this->extractSections($xpath),
                'videos' => $this->extractVideos($xpath),
                'images' => $this->extractImages($xpath),
                'text_content' => $this->extractTextContent($xpath),
            ];

            $scrapedData->update([
                'status' => 'completed',
            ]);

            // Save content details
            $scrapedData->contentDetail()->create([
                'title' => $data['title'] ?? '',
                'description' => '',
                'metadata' => [
                    'status_code' => $response->status(),
                    'headers' => $response->headers(),
                ],
            ]);

            // Save videos
            foreach ($data['videos'] ?? [] as $video) {
                $scrapedData->videos()->create([
                    'type' => $video['type'] ?? 'url',
                    'src' => $video['src'] ?? '',
                ]);
            }

            // Save images
            foreach ($data['images'] ?? [] as $image) {
                $scrapedData->images()->create([
                    'url' => $image['src'] ?? '',
                    'alt' => $image['alt'] ?? null,
                    'type' => 'basic',
                ]);
            }

            // No social/contact extraction in this simple example

            return $scrapedData;
        } catch (\Exception $e) {
            $scrapedData->update(['status' => 'failed']);
            $scrapedData->contentDetail()->updateOrCreate(
                ['scraped_data_id' => $scrapedData->id],
                [
                    'title' => 'Error',
                    'description' => $e->getMessage(),
                    'metadata' => [
                        'error' => $e->getMessage(),
                        'crawled_at' => now(),
                        'platform' => 'canva'
                    ]
                ]
            );
            throw $e;
        }
    }

    protected function extractTitle(DOMXPath $xpath): ?string
    {
        $titleNodes = $xpath->query('//h1');
        return $titleNodes->length > 0 ? $titleNodes->item(0)->textContent : null;
    }

    protected function extractSections(DOMXPath $xpath): array
    {
        $sections = [];
        $sectionNodes = $xpath->query('//section');
        
        foreach ($sectionNodes as $section) {
            $sections[] = [
                'title' => $this->getSectionTitle($section, $xpath),
                'content' => $section->textContent,
            ];
        }

        return $sections;
    }

    protected function extractVideos(DOMXPath $xpath): array
    {
        $videos = [];
        $videoNodes = $xpath->query('//video | //iframe[contains(@src, "youtube") or contains(@src, "vimeo")]');
        
        foreach ($videoNodes as $video) {
            $videos[] = [
                'src' => $video->getAttribute('src'),
                'type' => $video->nodeName,
            ];
        }

        return $videos;
    }

    protected function extractImages(DOMXPath $xpath): array
    {
        $images = [];
        $imageNodes = $xpath->query('//img');
        
        foreach ($imageNodes as $image) {
            $images[] = [
                'src' => $image->getAttribute('src'),
                'alt' => $image->getAttribute('alt'),
            ];
        }

        return $images;
    }

    protected function extractTextContent(DOMXPath $xpath): array
    {
        $textContent = [];
        $textNodes = $xpath->query('//p | //h2 | //h3 | //h4 | //h5 | //h6');
        
        foreach ($textNodes as $node) {
            $textContent[] = [
                'type' => $node->nodeName,
                'content' => $node->textContent,
            ];
        }

        return $textContent;
    }

    protected function getSectionTitle($section, DOMXPath $xpath): ?string
    {
        $titleNode = $xpath->query('.//h2 | .//h3', $section)->item(0);
        return $titleNode ? $titleNode->textContent : null;
    }
}