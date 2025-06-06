<?php

namespace App\Services;

use App\Models\ScrapedData;
use Symfony\Component\DomCrawler\Crawler as DomCrawler;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class UniversalScraper
{
    protected $currentUrl;

    public function scrape(string $url)
    {
        try {
            $data = $this->crawlUrl($url);

            $scrapedData = ScrapedData::updateOrCreate(
                ['url' => $url],
                [
                    'platform' => $this->detectPlatform($url),
                    'content' => $data,
                    'metadata' => [
                        'crawled_at' => now(),
                        'platform' => $this->detectPlatform($url)
                    ],
                    'status' => 'completed'
                ]
            );

            return $scrapedData;
        } catch (\Exception $e) {
            $scrapedData = ScrapedData::updateOrCreate(
                ['url' => $url],
                [
                    'platform' => $this->detectPlatform($url),
                    'content' => [
                        'error' => $e->getMessage()
                    ],
                    'metadata' => [
                        'crawled_at' => now(),
                        'platform' => $this->detectPlatform($url)
                    ],
                    'status' => 'failed'
                ]
            );

            throw $e;
        }
    }

    protected function crawlUrl(string $url): array
    {
        $this->currentUrl = $url;

        $data = [
            'title' => '',
            'description' => '',
            'content' => [],
            'images' => [],
            'videos' => [],
            'links' => [],
            'metadata' => [],
            'contact_info' => [],
            'social_links' => []
        ];

        try {
            $response = Http::get($url);

            if ($response->failed()) {
                throw new \Exception("Failed to fetch URL: {$url}");
            }

            $html = $response->body();

            // Extract JSON scripts for social/contact data (optional)
            $jsonSocialLinks = [];
            $jsonContactLinks = [];
            $jsonContents = [];
            if (preg_match_all('/<script[^>]*type=["\']application\/json["\'][^>]*>(.*?)<\/script>/si', $html, $matches)) {
                foreach ($matches[1] as $jsonStr) {
                    $jsonData = json_decode($jsonStr, true);
                    if ($jsonData && is_array($jsonData)) {
                        $extracted = $this->extractSocialAndContactFromJson($jsonData);
                        if (!empty($extracted['social'])) {
                            foreach ($extracted['social'] as $platform => $urls) {
                                foreach ((array)$urls as $urlVal) {
                                    $jsonSocialLinks[$platform][] = $urlVal;
                                }
                            }
                        }
                        if (!empty($extracted['contact'])) {
                            foreach ($extracted['contact'] as $type => $values) {
                                foreach ((array)$values as $val) {
                                    $jsonContactLinks[$type][] = $val;
                                }
                            }
                        }
                        if (!empty($extracted['content'])) {
                            $jsonContents[] = $extracted['content'];
                        }
                    }
                }
            }

            $crawler = new DomCrawler($html);

            $data['title'] = $crawler->filter('title')->count() ? $crawler->filter('title')->text() : '';

            $metadata = $this->extractMetadata($crawler);
            $data['metadata'] = $metadata;
            // Extract description from meta tags
           $descriptions = [];
           if (isset($metadata['description']) && !empty($metadata['description'])) {
            $descriptions[] = $metadata['description'];
           }
           if (isset($metadata['og:description']) && !empty($metadata['og:description'])) {
             $descriptions[] = $metadata['og:description'];
           }
           // 2. Headings with keywords and their following paragraphs
            $descKeywords = ['about', 'what i do', 'bio', 'summary', 'introduction', 'profile', 'description'];
            $crawler->filter('h1, h2, h3, h4, h5, h6')->each(function (DomCrawler $node) use (&$descriptions, $descKeywords) {
                $headingText = strtolower($node->text());
                foreach ($descKeywords as $kw) {
                    if (strpos($headingText, $kw) !== false) {
                        // Get next sibling paragraphs/divs
                        $next = $node->nextAll()->filter('p, div, span');
                        foreach ($next as $sib) {
                            $text = trim($sib->textContent);
                            if (mb_strlen($text) > 40) {
                                $descriptions[] = $text;
                            }
                        }
                    }
                }
            });
            // 3. Large <p> or <span> blocks (fallback) using voku/simple_html_dom if available
            if (class_exists('voku\\helper\\SimpleHtmlDom')) {
                $simpleHtml = \voku\helper\SimpleHtmlDom::str_get_html($html);
                if ($simpleHtml) {
                    foreach ($simpleHtml->find('p, span') as $node) {
                        $text = trim($node->text()); // voku handles <br> and inline elements
                        if (mb_strlen($text) > 40) {
                            $descriptions[] = $text;
                        }
                    }
                }
            } else {
                // Fallback to DomCrawler if voku/simple_html_dom is not installed
                $crawler->filter('p, span')->each(function (DomCrawler $node) use (&$descriptions) {
                    $domNode = $node->getNode(0);
                    if ($domNode && $domNode->ownerDocument) {
                        $html = $domNode->ownerDocument->saveHTML($domNode);
                        $text = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $html));
                        $text = trim($text);
                        if (mb_strlen($text) > 40) {
                            $descriptions[] = $text;
                        }
                    }
                });
            }
            // Remove duplicates and empty
            $descriptions = array_values(array_unique(array_filter($descriptions)));
            // Set main description as the first found, or empty string
            $description = $descriptions[0] ?? '';
            $data['description'] = $description;
            $data['descriptions'] = $descriptions;

            $data['content'] = $this->extractContent($crawler);
            if (!empty($jsonContents)) {
                $data['content'] = array_merge($data['content'], ...$jsonContents);
            }

            $data['images'] = $this->extractImages($crawler);
            $data['videos'] = $this->extractVideos($crawler);
            $data['links'] = $this->extractLinks($crawler);

            $data['contact_info'] = $this->extractContactInfo($crawler);
            if (!empty($jsonContactLinks)) {
                foreach ($jsonContactLinks as $type => $vals) {
                    $data['contact_info'][$type] = array_values(array_unique(array_merge(
                        $data['contact_info'][$type] ?? [], $vals
                    )));
                }
            }

            // Compose social_links by merging HTML, JSON, and text extractions
            $socialLinks = [];
            if (isset($data['links']['social'])) {
                foreach ($data['links']['social'] as $platform => $urls) {
                    foreach ((array)$urls as $urlVal) {
                        $socialLinks[$platform][] = $urlVal;
                    }
                }
            }
            foreach ($jsonSocialLinks as $platform => $urls) {
                foreach ((array)$urls as $urlVal) {
                    $socialLinks[$platform][] = $urlVal;
                }
            }
            // Add social handles from text
            $handlesFromText = $this->extractSocialHandlesFromText($crawler);
            foreach ($handlesFromText as $platform => $handles) {
                foreach ((array)$handles as $handle) {
                    $socialLinks[$platform][] = $handle;
                }
            }
            foreach ($socialLinks as $platform => $urls) {
                $socialLinks[$platform] = array_values(array_unique($urls));
            }
            $data['social_links'] = $socialLinks;

            return $data;
        } catch (\Exception $e) {
            throw new \Exception("Failed to crawl URL: " . $e->getMessage());
        }
    }

    protected function extractSocialAndContactFromJson(array $jsonData): array
    {
        $social = [];
        $contact = [];
        $content = [];
        $socialDomains = [
            'facebook' => ['facebook.com', 'fb.com', 'fb.me'],
            'instagram' => ['instagram.com', 'instagr.am'],
            'linkedin' => ['linkedin.com', 'linked.in'],
            'twitter' => ['twitter.com', 't.co', 'x.com'],
            'youtube' => ['youtube.com', 'youtu.be'],
            'github' => ['github.com'],
            'behance' => ['behance.net'],
            'dribbble' => ['dribbble.com']
        ];
        $contactPatterns = [
            'email' => '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/',
            'phone' => '/\+?[0-9][0-9\-\s]{7,}/'
        ];

        $iterator = new \RecursiveIteratorIterator(new \RecursiveArrayIterator($jsonData));
        foreach ($iterator as $key => $value) {
            if (is_string($value)) {
                foreach ($socialDomains as $platform => $domains) {
                    foreach ($domains as $domain) {
                        if (stripos($value, $domain) !== false) {
                            $social[$platform][] = $value;
                        }
                    }
                }
                foreach ($contactPatterns as $type => $pattern) {
                    if (preg_match($pattern, $value, $matches)) {
                        $contact[$type][] = $matches[0];
                    }
                }
            }
        }
        if (isset($jsonData['content'])) {
            $content = $jsonData['content'];
        }
        return [
            'social' => $social,
            'contact' => $contact,
            'content' => $content
        ];
    }

    protected function detectPlatform(string $url): string
    {
        if (Str::contains($url, 'canva.site')) {
            return 'canva';
        }
        if (Str::contains($url, 'behance.net')) {
            return 'behance';
        }
        if (Str::contains($url, 'dribbble.com')) {
            return 'dribbble';
        }
        return 'generic';
    }

    protected function extractContent(DomCrawler $crawler): array
    {
        $content = [];
        $crawler->filter('h1, h2, h3, h4, h5, h6, p, article, section')->each(function (DomCrawler $node) use (&$content) {
            $content[] = [
                'type' => $node->nodeName(),
                'text' => trim($node->text()),
                'html' => $node->html()
            ];
        });
        return $content;
    }

    protected function extractImages(DomCrawler $crawler): array
    {
        $images = [];
        $crawler->filter('img')->each(function (DomCrawler $node) use (&$images) {
            $images[] = [
                'src' => $this->makeAbsoluteUrl($node->attr('src')),
                'alt_text' => $node->attr('alt')
            ];
        });
        return $images;
    }

    protected function extractVideos(DomCrawler $crawler): array
    {
        $videos = [];

        // Extract <video> tags
        $crawler->filter('video')->each(function (DomCrawler $node) use (&$videos) {
            $src = $node->attr('src');
            if (empty($src)) {
                return;
            }
            $videos[] = [
                'type' => 'video',
                'src' => $this->makeAbsoluteUrl($src),
                'poster' => $node->attr('poster') ?: null,
            ];
        });

        // Extract <iframe> tags for YouTube, Vimeo, etc.
        $crawler->filter('iframe')->each(function (DomCrawler $node) use (&$videos) {
            $src = $node->attr('src');
            if (empty($src)) {
                return;
            }
            if (preg_match('/(youtube\\.com|youtu\\.be|vimeo\\.com|dailymotion\\.com|player\\.vimeo\\.com)/i', $src)) {
                $videos[] = [
                    'type' => 'iframe',
                    'src' => $this->makeAbsoluteUrl($src),
                    'allowfullscreen' => $node->attr('allowfullscreen') !== null,
                    'sandbox' => $node->attr('sandbox') ?: null,
                ];
            }
        });

        // Extract video URLs from the raw HTML (for sites like Canva)
        if (isset($this->currentUrl) && !empty($this->currentUrl)) {
            try {
                $html = Http::get($this->currentUrl)->body();
                // Regex for YouTube and Vimeo URLs
                $videoUrlPatterns = [
                    '/https?:\\/\\/(?:www\\.)?youtube\\.com\\/watch\\?v=[A-Za-z0-9_-]+/i',
                    '/https?:\\/\\/(?:www\\.)?youtube\\.com\\/shorts\\/[A-Za-z0-9_-]+/i',
                    '/https?:\\/\\/(?:www\\.)?youtu\\.be\\/[A-Za-z0-9_-]+/i',
                    '/https?:\\/\\/(?:www\\.)?vimeo\\.com\\/[0-9]+/i',
                ];
                foreach ($videoUrlPatterns as $pattern) {
                    if (preg_match_all($pattern, $html, $matches)) {
                        foreach ($matches[0] as $url) {
                            $videos[] = [
                                'type' => 'url',
                                'src' => $url
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                // Ignore errors in this fallback
            }
        }

        // Remove duplicates by src
        $videos = array_values(array_unique($videos, SORT_REGULAR));

        return $videos;
    }
    
    protected function extractLinks(DomCrawler $crawler): array
    {
        $links = [
            'social' => [
                'facebook' => [],
                'instagram' => [],
                'linkedin' => [],
                'twitter' => [],
                'youtube' => [],
                'github' => [],
                'behance' => [],
                'dribbble' => []
            ],
            'contact' => [],
            'other' => []
        ];

        $socialDomains = [
            'facebook' => ['facebook.com', 'fb.com', 'fb.me'],
            'instagram' => ['instagram.com', 'instagr.am'],
            'linkedin' => ['linkedin.com', 'linked.in'],
            'twitter' => ['twitter.com', 't.co', 'x.com'],
            'youtube' => ['youtube.com', 'youtu.be'],
            'github' => ['github.com'],
            'behance' => ['behance.net'],
            'dribbble' => ['dribbble.com']
        ];

        // Patterns for valid Facebook and YouTube profile/channel URLs
        $validFacebookPattern = '/facebook\.com\/(?:[A-Za-z0-9.\-_]+|profile\.php\?id=\d+(&[A-Za-z0-9_=&]*)?)/i';
        $validYouTubePattern = '/youtube\.com\/(channel|user|@)[A-Za-z0-9_\-]+/i';

        $crawler->filter('a')->each(function (DomCrawler $node) use (&$links, $socialDomains, $validFacebookPattern, $validYouTubePattern) {
            $href = $node->attr('href');
            if (empty($href)) return;

            $href = $this->makeAbsoluteUrl($href);

            $isSocial = false;
            foreach ($socialDomains as $platform => $domains) {
                foreach ($domains as $domain) {
                    if (stripos($href, $domain) !== false) {
                        // Filter for Facebook and YouTube
                        if ($platform === 'facebook') {
                            // If it's a profile.php link, ensure we extract the id
                            if (preg_match('/facebook\\.com\\/profile\\.php(\?id=\d+)/i', $href, $match)) {
                                $links['social'][$platform][] = 'https://facebook.com/profile.php' . $match[1];
                                $isSocial = true;
                                break 2;
                            } elseif (!preg_match($validFacebookPattern, $href)) {
                                continue 2;
                            }
                        }
                        if ($platform === 'youtube' && !preg_match($validYouTubePattern, $href)) {
                            continue 2;
                        }
                        $links['social'][$platform][] = $href;
                        $isSocial = true;
                        break 2;
                    }
                }
            }

            if ($isSocial) return;

            // Consider contact links (email, phone, etc.)
            $text = trim($node->text());
            $title = $node->attr('title');

            if (preg_match('/(?:mailto:|tel:|whatsapp:|t\.me|telegram\.me|contact|email|phone|whatsapp|telegram)/i', $href) || 
                preg_match('/(?:contact|email|phone|whatsapp|telegram|message|reach out)/i', $text)) {
                $links['contact'][] = [
                    'href' => $href,
                    'text' => $text,
                    'title' => $title
                ];
            } else {
                $links['other'][] = [
                    'href' => $href,
                    'text' => $text,
                    'title' => $title
                ];
            }
        });

        // Remove empty social arrays and duplicates
        foreach ($links['social'] as $platform => $urls) {
            if (empty($urls)) {
                unset($links['social'][$platform]);
            } else {
                $links['social'][$platform] = array_values(array_unique($urls));
            }
        }

        return $links;
    }


    protected function extractContactInfo(DomCrawler $crawler): array
    {
        $contactInfo = [
            'email' => [],
            'social' => []
        ];

        $crawler->filter('body')->each(function (DomCrawler $node) use (&$contactInfo) {
            $text = $node->text();
            preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $emails);
            if (!empty($emails[0])) {
                $contactInfo['email'] = array_values(array_unique($emails[0]));
            }
        });

        $crawler->filter('body')->each(function (DomCrawler $node) use (&$contactInfo) {
            $text = $node->text();
            preg_match_all('/@[\w\d.]+/', $text, $handles);
            if (!empty($handles[0])) {
                $contactInfo['social'] = array_values(array_unique($handles[0]));
            }
        });

        return $contactInfo;
    }

    protected function extractMetadata(DomCrawler $crawler): array
    {
        $metadata = [];
        $crawler->filter('meta')->each(function (DomCrawler $node) use (&$metadata) {
            $name = $node->attr('name') ?? $node->attr('property');
            if ($name) {
                $metadata[$name] = $node->attr('content');
            }
        });
        return $metadata;
    }

    protected function makeAbsoluteUrl($url)
    {
        if (empty($url)) {
            return $url;
        }
        if (strpos($url, 'http') === 0) {
            return $url;
        }
        if (strpos($url, '//') === 0) {
            return 'https:' . $url;
        }
        if (strpos($url, '/') === 0) {
            return 'https://' . parse_url($this->currentUrl, PHP_URL_HOST) . $url;
        }
        return 'https://' . parse_url($this->currentUrl, PHP_URL_HOST) . '/' . $url;
    }

    // Add a new method to extract social handles from the body text
    protected function extractSocialHandlesFromText(DomCrawler $crawler): array
    {
        $platformPatterns = [
            'twitter'   => '/(?<![\w.])@([A-Za-z0-9_]{1,15})\b/',
            'instagram' => '/(?<![\w.])@([A-Za-z0-9_.]{1,30})\b/',
            'facebook'  => '/facebook\.com\/([A-Za-z0-9.]+)/',
            'linkedin'  => '/linkedin\.com\/in\/([A-Za-z0-9\-]+)/',
        ];

        $handles = [];
        $crawler->filter('body')->each(function (DomCrawler $node) use (&$handles, $platformPatterns) {
            $text = $node->text();
            foreach ($platformPatterns as $platform => $pattern) {
                if (preg_match_all($pattern, $text, $matches)) {
                    foreach ($matches[1] as $handle) {
                        $handles[$platform][] = $handle;
                    }
                }
            }
        });

        // Clean up and deduplicate handles
        foreach ($handles as $platform => $usernames) {
            $handles[$platform] = array_values(array_unique($usernames));
        }

        return $handles;
    }

    // Add a method to extract and normalize email addresses
    protected function extractEmails(DomCrawler $crawler): array
    {
        $emails = [];
        $crawler->filter('body')->each(function (DomCrawler $node) use (&$emails) {
            $text = $node->text();
            preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $matches);
            foreach ($matches[0] as $email) {
                $emails[] = strtolower(trim($email));
            }
        });
        return array_values(array_unique($emails));
    }
}
