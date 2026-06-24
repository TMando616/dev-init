<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropIndex(['category_id', 'order', 'id']);
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');

            $table->foreignId('lesson_id')->after('content')->constrained()->cascadeOnDelete();
            $table->index(['lesson_id', 'order', 'id']);
        });
    }

    public function down(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropIndex(['lesson_id', 'order', 'id']);
            $table->dropForeign(['lesson_id']);
            $table->dropColumn('lesson_id');

            $table->foreignId('category_id')->nullable()->after('content')->constrained()->nullOnDelete();
            $table->index(['category_id', 'order', 'id']);
        });
    }
};
