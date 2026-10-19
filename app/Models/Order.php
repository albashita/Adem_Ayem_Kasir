<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';
    protected $primaryKey = 'id_order';

    protected $fillable = [
        'invoice_number', 'order_date', 'subtotal', 'discount', 'tax', 'total',
        'status', 'customer_name', 'order_type', 'service_type', 'users_id_user',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'orders_id_order', 'id_order');
    }
    public function payment()
{
    return $this->hasOne(Payment::class, 'orders_id_order', 'id_order');
}
}