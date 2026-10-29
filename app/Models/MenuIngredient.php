<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuIngredient extends Model
{
    protected $table = 'menu_ingredients';

    protected $primaryKey = 'id_menu_ingredient';

    public $timestamps = false;

    protected $fillable = [
        'menus_id_menu',
        'stock_items_id_stock_item',
        'quantity_required',
    ];

    protected $casts = [
        'quantity_required' => 'float',
    ];

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'menus_id_menu', 'id_menu');
    }

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class, 'stock_items_id_stock_item', 'id_stock_item');
    }

    /**
     * Hitung kebutuhan bahan baku berdasarkan jumlah porsi produksi.
     */
    public function calculateRequiredQuantity(float|int $portions): float|int
    {
        return (float) $this->quantity_required * $portions;
    }
}
