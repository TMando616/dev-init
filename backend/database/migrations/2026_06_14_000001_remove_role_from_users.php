<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Move existing admin users into the admins table (preserving the already
     * hashed password), remove them from users, then drop the role column.
     */
    public function up(): void
    {
        $admins = DB::table('users')->where('role', 'admin')->get();

        foreach ($admins as $admin) {
            $exists = DB::table('admins')->where('email', $admin->email)->exists();

            if (!$exists) {
                DB::table('admins')->insert([
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'password' => $admin->password, // already hashed; do not re-hash
                    'created_at' => $admin->created_at,
                    'updated_at' => $admin->updated_at,
                ]);
            }

            DB::table('users')->where('id', $admin->id)->delete();
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Restores the role column only (admin rows are not moved back).
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user');
        });
    }
};
