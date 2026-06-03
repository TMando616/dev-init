<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('order')->default(0);
            $table->timestamps();

            // Backs ordered listings and the prev/next neighbor lookups in MaterialRepository.
            $table->index(['category_id', 'order', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};
