<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $table = 'order_items';
    protected $primaryKey = 'id_order_item';
    public $timestamps = false; // tabel hanya punya created_at (default DB)

    protected $fillable = ['quantity', 'price', 'subtotal', 'menus_id_menu', 'orders_id_order'];

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'menus_id_menu', 'id_menu');
    }
}