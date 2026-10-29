<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockItem extends Model
{
    protected $table = 'stock_items';

    protected $primaryKey = 'id_stock_item';

    protected $fillable = [
        'name',
        'unit',
        'current_stock',
        'minimum_stock',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active'     => 'boolean',
        'current_stock' => 'integer',
        'minimum_stock' => 'integer',
    ];

    public function movements()
    {
        return $this->hasMany(StockMovement::class, 'stock_items_id_stock_item', 'id_stock_item');
    }

    public function menuIngredients()
    {
        return $this->hasMany(MenuIngredient::class, 'stock_items_id_stock_item', 'id_stock_item');
    }

    public function menus()
    {
        return $this->belongsToMany(
            Menu::class,
            'menu_ingredients',
            'stock_items_id_stock_item',
            'menus_id_menu',
            'id_stock_item',
            'id_menu'
        )->withPivot(['id_menu_ingredient', 'quantity_required']);
    }
}
