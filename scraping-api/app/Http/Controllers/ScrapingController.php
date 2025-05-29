<?php

namespace App\Http\Controllers;

use App\Models\ScrapedData;
use App\Services\UniversalScraper;
use Illuminate\Http\Request;

class ScrapingController extends Controller
{
    protected $scraper;

    public function __construct(UniversalScraper $scraper)
    {
        $this->scraper = $scraper;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $allData = ScrapedData::all();

        return response()->json([
            'message' => 'All scraped data retrieved successfully',
            'data' => $allData
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function scrape(Request $request)
    {
        $request->validate([
            'url' => 'required|url'
        ]);

        try {
            $result = $this->scraper->scrape($request->url);
            
            return response()->json([
                'message' => 'Scraping completed successfully',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Scraping failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function status($id)
    {
        $scrapedData = ScrapedData::findOrFail($id);
        return response()->json($scrapedData);
    }
}
