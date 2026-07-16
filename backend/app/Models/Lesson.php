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
        'expected_output',
        'language',
    ];

    public function categories()
    {
        return $this->belongsToMany(Category::class);
    }

    public function materials()
    {
        return $this->hasMany(Material::class)->orderBy('order')->orderBy('id');
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function getNextLessonIdAttribute(): ?int
    {
        return static::where('id', '>', $this->id)->orderBy('id')->value('id');
    }
}
