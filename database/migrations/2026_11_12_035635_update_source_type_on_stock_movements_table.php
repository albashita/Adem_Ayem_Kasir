<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE stock_movements MODIFY source_type ENUM('purchase','harvest','gift','used','spoiled','expired','lost','other') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE stock_movements MODIFY source_type ENUM('purchase','harvest','gift','other') NOT NULL");
    }
};