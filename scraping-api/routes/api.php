<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ScrapingController;

Route::post('/scrape', [ScrapingController::class, 'scrape']);
Route::get('/scrape/{id}', [ScrapingController::class, 'status']); 
Route::get('/scraped-data', [ScrapingController::class, 'index']);