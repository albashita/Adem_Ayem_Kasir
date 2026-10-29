<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('menus', 'kode_menu')) {
            Schema::table('menus', function (Blueprint $table) {
                $table->string('kode_menu', 30)->nullable()->after('id_menu');
            });

            // Isi kode_menu untuk menu yang sudah ada sebelumnya
            DB::statement("UPDATE menus SET kode_menu = CONCAT('MENU-', LPAD(id_menu, 3, '0')) WHERE kode_menu IS NULL");

            Schema::table('menus', function (Blueprint $table) {
                $table->unique('kode_menu', 'menus_kode_menu_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('menus', 'kode_menu')) {
            Schema::table('menus', function (Blueprint $table) {
                $table->dropUnique('menus_kode_menu_unique');
                $table->dropColumn('kode_menu');
            });
        }
    }
};
