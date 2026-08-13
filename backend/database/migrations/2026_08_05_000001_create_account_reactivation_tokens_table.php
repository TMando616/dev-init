<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('account_reactivation_tokens', function (Blueprint $table) {
            // email を主キーにすることで、1メールアドレスにつき有効な復会
            // リンクが常に1本だけになる（password_reset_tokens と同じ構造）。
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_reactivation_tokens');
    }
};
