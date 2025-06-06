<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SocialLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'scraped_data_id',
        'platform',
        'username',
        'url',
        'type'
    ];

    public function scrapedData()
    {
        return $this->belongsTo(ScrapedData::class);
    }
}
