<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tangani data lama secara aman sebelum tipe kolom diubah ke ENUM
        DB::table('stock_items')
            ->whereIn(DB::raw('LOWER(TRIM(unit))'), ['kg', 'kilogram', 'ons', 'g'])
            ->update(['unit' => 'gram']);

        DB::table('stock_items')
            ->whereIn(DB::raw('LOWER(TRIM(unit))'), ['l', 'ml'])
            ->update(['unit' => 'liter']);

        DB::table('stock_items')
            ->whereIn(DB::raw('LOWER(TRIM(unit))'), ['biji', 'butir', 'buah', 'pack', 'ikat', 'bungkus', 'btg', 'batang', 'porsi'])
            ->update(['unit' => 'pcs']);

        // Nilai lain yang belum sesuai diarahkan aman ke 'pcs'
        DB::table('stock_items')
            ->whereNotIn(DB::raw('LOWER(TRIM(unit))'), ['gram', 'liter', 'pcs'])
            ->orWhereNull('unit')
            ->update(['unit' => 'pcs']);

        // Pastikan huruf kecil rapi
        DB::statement("UPDATE `stock_items` SET `unit` = LOWER(TRIM(`unit`))");

        // 2. Ubah tipe kolom unit menjadi ENUM('gram', 'liter', 'pcs') NOT NULL
        DB::statement("ALTER TABLE `stock_items` MODIFY COLUMN `unit` ENUM('gram', 'liter', 'pcs') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `stock_items` MODIFY COLUMN `unit` VARCHAR(15) NOT NULL");
    }
};
