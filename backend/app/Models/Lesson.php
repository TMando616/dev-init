<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'model_answer',
    ];

    public function categories()
    {
        return $this->belongsToMany(Category::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}
