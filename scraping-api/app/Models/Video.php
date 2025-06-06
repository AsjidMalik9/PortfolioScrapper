<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    use HasFactory;

    protected $fillable = [
        'scraped_data_id',
        'type',
        'src'
    ];

    public function scrapedData()
    {
        return $this->belongsTo(ScrapedData::class);
    }
}
