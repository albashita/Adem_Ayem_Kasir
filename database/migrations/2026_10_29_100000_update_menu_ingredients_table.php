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
        Schema::table('menu_ingredients', function (Blueprint $table) {
            $table->decimal('quantity_required', 10, 2)->change();
            $table->unique(['menus_id_menu', 'stock_items_id_stock_item'], 'unique_menu_ingredient');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_ingredients', function (Blueprint $table) {
            $table->dropUnique('unique_menu_ingredient');
            $table->integer('quantity_required')->change();
        });
    }
};
