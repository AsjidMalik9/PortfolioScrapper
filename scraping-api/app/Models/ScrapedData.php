<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ScrapedData extends Model
{
    use HasFactory;

    protected $fillable = [
        'url',
        'platform',
        'status'
    ];

    public function contentDetail()
    {
        return $this->hasOne(ContentDetail::class);
    }

    public function videos()
    {
        return $this->hasMany(Video::class);
    }

    public function images()
    {
        return $this->hasMany(Image::class);
    }

    public function socialLinks()
    {
        return $this->hasMany(SocialLink::class);
    }

    public function contactInfos()
    {
        return $this->hasMany(ContactInfo::class);
    }
}
