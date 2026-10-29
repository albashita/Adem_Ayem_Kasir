<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $table = 'menus';

    protected $primaryKey = 'id_menu';

    protected $fillable = [
        'kode_menu',
        'name',
        'description',
        'price',
        'image',
        'is_active',
        'categories_id_categorie',
    ];

    protected $appends = ['code'];

    public function getCodeAttribute(): string
    {
        return (string) ($this->kode_menu ?: ('MENU-' . str_pad($this->id_menu, 3, '0', STR_PAD_LEFT)));
    }

    protected $casts = [
        'price' => 'integer',
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(
            Category::class,
            'categories_id_categorie',
            'id_categorie'
        );
    }

    public function ingredients()
    {
        return $this->hasMany(
            MenuIngredient::class,
            'menus_id_menu',
            'id_menu'
        );
    }

    public function stockItems()
    {
        return $this->belongsToMany(
            StockItem::class,
            'menu_ingredients',
            'menus_id_menu',
            'stock_items_id_stock_item',
            'id_menu',
            'id_stock_item'
        )->withPivot(['id_menu_ingredient', 'quantity_required']);
    }

    /**
     * Menghitung total kebutuhan semua bahan baku untuk sejumlah porsi menu.
     */
    public function calculateIngredientsRequirement(float|int $portions): array
    {
        return $this->ingredients()->with('stockItem')->get()->map(function ($ingredient) use ($portions) {
            return [
                'stock_item_id' => $ingredient->stock_items_id_stock_item,
                'stock_item_name' => $ingredient->stockItem?->name,
                'unit' => $ingredient->stockItem?->unit,
                'quantity_per_portion' => (float) $ingredient->quantity_required,
                'total_required' => $ingredient->calculateRequiredQuantity($portions),
                'current_stock' => $ingredient->stockItem?->current_stock,
            ];
        })->toArray();
    }
}
