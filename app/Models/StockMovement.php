<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $table = 'stock_movements';

    protected $primaryKey = 'id_stock_movements';

    // Tabel hanya punya created_at, tidak ada updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'type',
        'quantity',
        'source_type',
        'description',
        'users_id_user',
        'stock_items_id_stock_item',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function stockItem()
    {
        return $this->belongsTo(StockItem::class, 'stock_items_id_stock_item', 'id_stock_item');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'users_id_user', 'id_user');
    }
}
