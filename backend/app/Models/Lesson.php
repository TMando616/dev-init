<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'title',
        'content',
        'model_answer',
    ];

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}
